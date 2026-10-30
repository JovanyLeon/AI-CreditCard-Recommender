import importlib.util
import json
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import repository
from app.core.config import settings
from app.domain.intent import AiRequest, AiResponse, ParsedRecommendationIntent
from app.services.ai_parser import IntentParser, OpenAIIntentParser
from app.services.card_repository import CardRepository
from app.services.recommender import recommend

router = APIRouter(prefix="/api/v1/ai", tags=["Optional AI"])
logger = logging.getLogger("cardmatch")
UNAVAILABLE = "AI recommendations are temporarily unavailable. You can still use guided search."


def ai_available() -> bool:
    return settings.ai_configured and importlib.util.find_spec("openai") is not None


def intent_parser() -> IntentParser:
    if not ai_available():
        raise HTTPException(503, UNAVAILABLE)
    return OpenAIIntentParser(settings)


@router.get("/status")
def status() -> dict[str, bool]:
    return {"ai_enabled": ai_available()}


@router.post("/recommendations")
async def ai_recommendations(
    request: AiRequest,
    parser: Annotated[IntentParser, Depends(intent_parser)],
    repo: Annotated[CardRepository, Depends(repository)],
) -> AiResponse:
    try:
        parsed = await parser.parse(request.message)
        # Revalidate even if an injected provider claims to return a typed object.
        intent = ParsedRecommendationIntent.model_validate(parsed.model_dump())
        conflict = intent.primary_goal == "student" and intent.student is False
        if conflict and not intent.conflicts:
            intent.conflicts = ["A student goal conflicts with non-student status."]
        needs_follow_up = (
            intent.needs_follow_up or bool(intent.conflicts) or intent.primary_goal is None
        )
        preferences = intent.to_request() if intent.primary_goal is not None else None
        result = recommend(preferences, repo.all()) if preferences and not needs_follow_up else None
        question = (
            intent.follow_up_question
            or "Which matters most: cash back, travel, or building credit?"
        )
        logger.info(
            json.dumps(
                {
                    "event": "ai_parser",
                    "success": True,
                    "follow_up": needs_follow_up,
                    "ai_enabled": True,
                }
            )
        )
        return AiResponse(
            interpreted_preferences=preferences,
            result=result,
            needs_follow_up=needs_follow_up,
            follow_up_question=question
            if needs_follow_up and request.follow_up_count < 2
            else None,
            missing_information=intent.missing_information,
            conflicts=intent.conflicts,
        )
    except Exception:
        # Never serialize provider exception text, request prompts, or credentials.
        logger.warning(json.dumps({"event": "ai_parser", "success": False, "ai_enabled": True}))
        raise HTTPException(503, UNAVAILABLE) from None
