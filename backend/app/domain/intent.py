from pydantic import Field

from app.domain.card import CreditProfile, DomainModel
from app.domain.preferences import PrimaryGoal, RecommendationRequest
from app.domain.recommendation import RecommendationResponse


class ParsedSpending(DomainModel):
    """Required nullable keys for the provider's strict structured-output schema."""

    dining: float | None
    groceries: float | None
    gas: float | None
    travel: float | None
    transit: float | None
    entertainment: float | None
    online_shopping: float | None
    drugstores: float | None
    other: float | None


class ParsedRecommendationIntent(DomainModel):
    primary_goal: PrimaryGoal | None
    monthly_spending: ParsedSpending | None
    max_annual_fee: float | None
    credit_profile: CreditProfile
    wants_no_foreign_transaction_fee: bool | None
    prefers_simple_rewards: bool | None
    intro_apr_priority: bool
    student: bool | None
    issuer_exclusions: list[str]
    missing_information: list[str]
    conflicts: list[str]
    needs_follow_up: bool
    follow_up_question: str | None

    def to_request(self) -> RecommendationRequest:
        data = self.model_dump(
            exclude={
                "missing_information",
                "conflicts",
                "needs_follow_up",
                "follow_up_question",
            }
        )
        if self.monthly_spending is not None:
            data["monthly_spending"] = self.monthly_spending.model_dump(exclude_none=True)
        return RecommendationRequest.model_validate(data)


class AiRequest(DomainModel):
    message: str = Field(min_length=10, max_length=2000)
    follow_up_count: int = Field(default=0, ge=0, le=2)


class AiResponse(DomainModel):
    interpreted_preferences: RecommendationRequest | None
    result: RecommendationResponse | None
    needs_follow_up: bool
    follow_up_question: str | None
    missing_information: list[str]
    conflicts: list[str]
    ai_enabled: bool = True
