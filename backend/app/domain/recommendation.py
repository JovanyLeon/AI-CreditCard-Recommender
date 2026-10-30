from pydantic import Field

from app.domain.card import CreditCard, DomainModel
from app.domain.preferences import RecommendationRequest


class RecommendationResult(DomainModel):
    rank: int
    card: CreditCard
    score: float = Field(ge=0, le=100)
    score_breakdown: dict[str, float]
    score_weights: dict[str, float]
    matched_preferences: list[str]
    tradeoffs: list[str]
    explanation: str
    estimated_annual_rewards: float | None
    estimated_net_annual_value: float | None


class RecommendationResponse(DomainModel):
    preferences: RecommendationRequest
    recommendations: list[RecommendationResult]
    compared_count: int
    eligible_count: int
    algorithm_version: str = "1.0"
    notices: list[str] = Field(default_factory=list)
