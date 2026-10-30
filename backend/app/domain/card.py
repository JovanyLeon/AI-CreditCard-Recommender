from datetime import date
from enum import StrEnum
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator

Money = Annotated[float, Field(ge=0, le=1_000_000, allow_inf_nan=False)]


class DomainModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True, allow_inf_nan=False)


class Category(StrEnum):
    DINING = "dining"
    GROCERIES = "groceries"
    GAS = "gas"
    TRAVEL = "travel"
    TRANSIT = "transit"
    ENTERTAINMENT = "entertainment"
    ONLINE_SHOPPING = "online_shopping"
    DRUGSTORES = "drugstores"
    ALL = "all"
    OTHER = "other"


class CardType(StrEnum):
    GENERAL = "general"
    STUDENT = "student"
    SECURED = "secured"
    BUSINESS = "business"


class CreditProfile(StrEnum):
    NEW = "new"
    FAIR = "fair"
    GOOD = "good"
    VERY_GOOD = "very_good"
    EXCELLENT = "excellent"
    UNKNOWN = "unknown"


class RewardRule(DomainModel):
    category: Category
    rate: float = Field(ge=0, le=100)
    unit: Literal["percent", "points", "miles"] = "percent"
    point_value: float = Field(default=0.01, gt=0, le=1)
    annual_cap: Money | None = None
    notes: str | None = None


class WelcomeOffer(DomainModel):
    description: str = Field(min_length=1)
    as_of: date


class CreditCard(DomainModel):
    id: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    name: str = Field(min_length=1)
    issuer: str = Field(min_length=1)
    network: str | None = None
    card_type: CardType
    annual_fee: Money
    foreign_transaction_fee_percent: float | None = Field(default=None, ge=0, le=100)
    reward_rules: list[RewardRule]
    welcome_offer: WelcomeOffer | None = None
    intro_purchase_apr_months: int | None = Field(default=None, ge=0, le=60)
    intro_balance_transfer_apr_months: int | None = Field(default=None, ge=0, le=60)
    perks: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    credit_profile: CreditProfile = CreditProfile.UNKNOWN
    source_url: HttpUrl
    terms_url: HttpUrl | None = None
    last_verified_at: date
    source_verified_at: date
    active: bool
    data_notes: list[str] = Field(default_factory=list)

    @field_validator("last_verified_at", "source_verified_at")
    @classmethod
    def no_future_verification(cls, value: date) -> date:
        if value > date.today():
            raise ValueError("Verification cannot be in the future")
        return value

    @field_validator("reward_rules")
    @classmethod
    def unique_categories(cls, rules: list[RewardRule]) -> list[RewardRule]:
        if len({r.category for r in rules}) != len(rules):
            raise ValueError("Reward categories must be unique")
        return rules
