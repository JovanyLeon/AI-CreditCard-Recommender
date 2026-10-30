import asyncio
import json
from collections.abc import Iterator
from typing import Any

import httpx
import pytest
from fastapi.testclient import TestClient
from pydantic import SecretStr

from app.api.ai import intent_parser
from app.core.config import Settings, settings
from app.domain.intent import ParsedRecommendationIntent
from app.main import app
from app.services.ai_parser import OpenAIIntentParser, ParserUnavailable
from app.services.card_repository import CardRepository
from app.services.recommender import recommend


def parsed(**changes: Any) -> ParsedRecommendationIntent:
    return ParsedRecommendationIntent.model_validate(
        {
            "primary_goal": "cash_back",
            "monthly_spending": None,
            "max_annual_fee": 0,
            "credit_profile": "unknown",
            "wants_no_foreign_transaction_fee": None,
            "prefers_simple_rewards": None,
            "intro_apr_priority": False,
            "student": True,
            "issuer_exclusions": [],
            "missing_information": [],
            "conflicts": [],
            "needs_follow_up": False,
            "follow_up_question": None,
            **changes,
        }
    )


class FakeParser:
    def __init__(
        self, intent: ParsedRecommendationIntent | None = None, error: Exception | None = None
    ):
        self.intent = intent or parsed()
        self.error = error

    async def parse(self, text: str) -> ParsedRecommendationIntent:
        if self.error:
            raise self.error
        return self.intent


@pytest.fixture(autouse=True)
def restore_dependencies() -> Iterator[None]:
    yield
    app.dependency_overrides.clear()


def test_ai_uses_the_same_engine() -> None:
    intent = parsed()
    app.dependency_overrides[intent_parser] = lambda: FakeParser(intent)
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/ai/recommendations",
            json={
                "message": "I'm a student. I want cash back and no annual fee.",
            },
        )
    expected = recommend(intent.to_request(), CardRepository().all())
    assert response.status_code == 200
    assert response.json()["result"] == expected.model_dump(mode="json")
    assert response.json()["interpreted_preferences"]["max_annual_fee"] == 0


@pytest.mark.parametrize(
    "intent",
    [
        parsed(primary_goal=None),
        parsed(conflicts=["No fee conflicts with a required premium fee."]),
        parsed(primary_goal="student", student=False),
        parsed(needs_follow_up=True, follow_up_question="Which goal matters most?"),
    ],
)
def test_follow_up_and_conflicts_do_not_rank(intent: ParsedRecommendationIntent) -> None:
    app.dependency_overrides[intent_parser] = lambda: FakeParser(intent)
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/ai/recommendations", json={"message": "A conflicting card request"}
        )
        capped = client.post(
            "/api/v1/ai/recommendations",
            json={
                "message": "A conflicting card request",
                "follow_up_count": 2,
            },
        )
    assert response.json()["needs_follow_up"] is True
    assert response.json()["result"] is None
    assert response.json()["follow_up_question"]
    assert capped.json()["follow_up_question"] is None


@pytest.mark.parametrize(
    "error", [TimeoutError(), RuntimeError("secret-provider-key"), ParserUnavailable()]
)
def test_provider_failure_is_safe_and_guided_stays_available(error: Exception) -> None:
    app.dependency_overrides[intent_parser] = lambda: FakeParser(error=error)
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/ai/recommendations", json={"message": "I want cash back please"}
        )
        assert response.status_code == 503
        assert "secret-provider-key" not in response.text
        assert (
            client.post("/api/v1/recommendations", json={"primary_goal": "cash_back"}).status_code
            == 200
        )


def test_invalid_structured_preferences_are_rejected() -> None:
    app.dependency_overrides[intent_parser] = lambda: FakeParser(parsed(max_annual_fee=-1))
    with TestClient(app) as client:
        assert (
            client.post(
                "/api/v1/ai/recommendations", json={"message": "I want cash back please"}
            ).status_code
            == 503
        )


def test_disabled_status_and_missing_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "enable_openai", False)
    with TestClient(app) as client:
        assert client.get("/api/v1/ai/status").json() == {"ai_enabled": False}
        assert (
            client.post(
                "/api/v1/ai/recommendations", json={"message": "I want cash back please"}
            ).status_code
            == 503
        )
    disabled = Settings(enable_openai=True, openai_api_key=SecretStr(""), openai_model="test-model")
    with pytest.raises(ParserUnavailable):
        asyncio.run(OpenAIIntentParser(disabled).parse("cash back"))


@pytest.mark.parametrize("message", [" ", "short", "x" * 2001])
def test_input_length_limit(message: str) -> None:
    app.dependency_overrides[intent_parser] = lambda: FakeParser()
    with TestClient(app) as client:
        assert (
            client.post("/api/v1/ai/recommendations", json={"message": message}).status_code == 422
        )


@pytest.mark.parametrize("mode", ["success", "refusal", "incomplete", "invalid_json", "rate_limit"])
def test_actual_sdk_transport_without_network(monkeypatch: pytest.MonkeyPatch, mode: str) -> None:
    openai = pytest.importorskip("openai")
    original_client = openai.AsyncOpenAI
    captured: list[dict[str, Any]] = []

    def handler(request: httpx.Request) -> httpx.Response:
        captured.append(json.loads(request.content))
        if mode == "rate_limit":
            return httpx.Response(429, json={"error": {"message": "limited", "type": "rate_limit"}})
        content = {"type": "output_text", "text": parsed().model_dump_json(), "annotations": []}
        if mode == "refusal":
            content = {"type": "refusal", "refusal": "Unable to comply"}
        elif mode == "invalid_json":
            content["text"] = "{invalid"
        return httpx.Response(
            200,
            json={
                "id": "resp_test",
                "object": "response",
                "created_at": 1,
                "model": "test-model",
                "status": "incomplete" if mode == "incomplete" else "completed",
                "output": [
                    {
                        "type": "message",
                        "id": "msg_test",
                        "status": "completed",
                        "role": "assistant",
                        "content": [content],
                    }
                ],
            },
        )

    def make_client(**kwargs: Any) -> Any:
        return original_client(
            **kwargs, http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler))
        )

    monkeypatch.setattr(openai, "AsyncOpenAI", make_client)
    parser = OpenAIIntentParser(
        Settings(
            enable_openai=True,
            openai_api_key=SecretStr("fake-test-key"),
            openai_model="test-model",
        )
    )
    if mode == "success":
        assert asyncio.run(parser.parse("I want cash back")) == parsed()
    else:
        with pytest.raises((ParserUnavailable, ValueError, openai.APIError)):
            asyncio.run(parser.parse("I want cash back"))
    assert captured[0]["store"] is False
    assert captured[0]["text"]["format"]["type"] == "json_schema"
    assert captured[0]["text"]["format"]["strict"] is True
    assert "card" not in captured[0]["text"]["format"]["schema"]["properties"]
