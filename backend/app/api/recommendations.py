import json
import logging
from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies import repository
from app.domain.preferences import RecommendationRequest
from app.domain.recommendation import RecommendationResponse
from app.services.card_repository import CardRepository
from app.services.recommender import recommend

router = APIRouter(prefix="/api/v1/recommendations", tags=["Recommendations"])
logger = logging.getLogger("cardmatch")


@router.post("")
def recommendations(
    request: RecommendationRequest,
    repo: Annotated[CardRepository, Depends(repository)],
) -> RecommendationResponse:
    result = recommend(request, repo.all())
    logger.info(
        json.dumps(
            {
                "event": "recommendations",
                "count": len(result.recommendations),
                "algorithm_version": result.algorithm_version,
            }
        )
    )
    return result
