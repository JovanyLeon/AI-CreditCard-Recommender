import pytest
from fastapi.testclient import TestClient

from app.domain.preferences import RecommendationRequest
from app.main import app
from app.services.card_repository import CardRepository
from app.services.recommender import recommend


def test_cards_and_detail() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/cards")
        assert response.status_code == 200
        cards = response.json()
        assert len(cards) == 6
        assert client.get(f"/api/v1/cards/{cards[0]['id']}").json() == cards[0]
        assert client.get("/api/v1/cards/missing").status_code == 404


def test_guided_contract_matches_engine() -> None:
    payload = {
        "primary_goal": "cash_back",
        "monthly_spending": {"groceries": 350, "dining": 200},
        "max_annual_fee": 0,
        "top_n": 3,
    }
    with TestClient(app) as client:
        response = client.post("/api/v1/recommendations", json=payload)
    expected = recommend(RecommendationRequest.model_validate(payload), CardRepository().all())
    assert response.status_code == 200
    assert response.json() == expected.model_dump(mode="json")
    assert len(response.json()["recommendations"]) == 3
    assert all(r["card"]["annual_fee"] == 0 for r in response.json()["recommendations"])


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"primary_goal": "unknown"},
        {"primary_goal": "cash_back", "max_annual_fee": -1},
        {"primary_goal": "cash_back", "monthly_spending": {"dining": -1}},
    ],
)
def test_invalid_api_input(payload: dict[str, object]) -> None:
    with TestClient(app) as client:
        assert client.post("/api/v1/recommendations", json=payload).status_code == 422


def test_no_match_returns_successful_empty_response() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/recommendations",
            json={
                "primary_goal": "cash_back",
                "issuer_exclusions": ["Chase", "Capital One"],
            },
        )
    assert response.status_code == 200
    assert response.json()["eligible_count"] == 0
    assert response.json()["recommendations"] == []
