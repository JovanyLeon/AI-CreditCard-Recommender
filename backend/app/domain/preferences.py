from enum import StrEnum
from typing import Annotated

from pydantic import Field, field_validator

from app.domain.card import CreditProfile, DomainModel, Money


class PrimaryGoal(StrEnum):
    CASH_BACK = "cash_back"
    TRAVEL = "travel"
    BUILD_CREDIT = "build_credit"
    STUDENT = "student"
    INTRO_APR = "intro_apr"
    EVERYDAY_SPENDING = "everyday_spending"


class MonthlySpending(DomainModel):
    dining: Money = 0
    groceries: Money = 0
    gas: Money = 0
    travel: Money = 0
    transit: Money = 0
    entertainment: Money = 0
    online_shopping: Money = 0
    drugstores: Money = 0
    other: Money = 0


class RecommendationRequest(DomainModel):
    primary_goal: PrimaryGoal
    monthly_spending: MonthlySpending | None = None
    max_annual_fee: Money | None = None
    credit_profile: CreditProfile = CreditProfile.UNKNOWN
    wants_no_foreign_transaction_fee: bool | None = None
    prefers_simple_rewards: bool | None = None
    intro_apr_priority: bool = False
    student: bool | None = None
    issuer_exclusions: list[Annotated[str, Field(min_length=1, max_length=100)]] = Field(
        default_factory=list, max_length=30
    )
    top_n: int = Field(default=3, ge=1, le=20)

    @field_validator("issuer_exclusions")
    @classmethod
    def clean_issuers(cls, values: list[str]) -> list[str]:
        return sorted(set(v.casefold() for v in values))
