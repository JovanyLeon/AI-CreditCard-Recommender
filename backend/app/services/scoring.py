from dataclasses import dataclass

from app.domain.card import CardType, Category, CreditCard, CreditProfile, RewardRule
from app.domain.preferences import MonthlySpending, PrimaryGoal, RecommendationRequest

COMPONENTS = (
    "rewards_fit",
    "annual_fee_fit",
    "goal_fit",
    "travel_fit",
    "intro_apr_fit",
    "simplicity_fit",
    "student_fit",
    "credit_profile_fit",
)
# Each row sums to one; neutral/unrequested preferences never manufacture a penalty.
WEIGHT_ROWS: dict[PrimaryGoal, tuple[float, ...]] = {
    PrimaryGoal.CASH_BACK: (0.40, 0.15, 0.20, 0.05, 0.05, 0.05, 0.02, 0.08),
    PrimaryGoal.TRAVEL: (0.25, 0.10, 0.30, 0.20, 0.02, 0.03, 0.02, 0.08),
    PrimaryGoal.BUILD_CREDIT: (0.05, 0.15, 0.35, 0.03, 0.02, 0.05, 0.05, 0.30),
    PrimaryGoal.STUDENT: (0.20, 0.15, 0.20, 0.05, 0.05, 0.05, 0.20, 0.10),
    PrimaryGoal.INTRO_APR: (0.10, 0.10, 0.20, 0.02, 0.45, 0.03, 0.02, 0.08),
    PrimaryGoal.EVERYDAY_SPENDING: (0.35, 0.15, 0.15, 0.05, 0.05, 0.15, 0.02, 0.08),
}
GOAL_WEIGHTS = {goal: dict(zip(COMPONENTS, row, strict=True)) for goal, row in WEIGHT_ROWS.items()}
REWARD_TARGET_PERCENT = 5.0
INTRO_TARGET_MONTHS = 21
FEE_SCALE = 250
PROFILE_ORDER = [
    CreditProfile.NEW,
    CreditProfile.FAIR,
    CreditProfile.GOOD,
    CreditProfile.VERY_GOOD,
    CreditProfile.EXCELLENT,
]


def effective_percent(rule: RewardRule) -> float:
    return rule.rate if rule.unit == "percent" else rule.rate * rule.point_value * 100


def category_rate(card: CreditCard, category: str) -> float:
    base = next((effective_percent(r) for r in card.reward_rules if r.category == Category.ALL), 0)
    return next((effective_percent(r) for r in card.reward_rules if r.category == category), base)


def annual_rewards(card: CreditCard, spending: MonthlySpending | None) -> float | None:
    if spending is None or sum(spending.model_dump().values()) == 0:
        return None
    base = category_rate(card, "all")
    total = 0.0
    for category, monthly in spending.model_dump().items():
        annual = monthly * 12
        rule = next((r for r in card.reward_rules if r.category == category), None)
        cap = rule.annual_cap if rule and rule.annual_cap is not None else annual
        total += min(annual, cap) * category_rate(card, category) / 100
        total += max(0, annual - cap) * base / 100
    return round(total, 2)


def credit_fit(card: CreditCard, request: RecommendationRequest) -> float:
    if CreditProfile.UNKNOWN in (card.credit_profile, request.credit_profile):
        return 0.5
    distance = max(
        0, PROFILE_ORDER.index(card.credit_profile) - PROFILE_ORDER.index(request.credit_profile)
    )
    return max(0, 1 - distance * 0.25)


def goal_fit(card: CreditCard, goal: PrimaryGoal) -> float:
    if goal == PrimaryGoal.STUDENT:
        return float(card.card_type == CardType.STUDENT)
    if goal == PrimaryGoal.BUILD_CREDIT:
        return 1.0 if "build_credit" in card.tags else 0.2
    if goal == PrimaryGoal.INTRO_APR:
        return min(1, (card.intro_purchase_apr_months or 0) / INTRO_TARGET_MONTHS)
    if goal == PrimaryGoal.EVERYDAY_SPENDING:
        return min(1, category_rate(card, "other") / 2)
    return 1.0 if goal.value in card.tags else 0.25


@dataclass(frozen=True)
class ScoredCard:
    card: CreditCard
    score: float
    components: dict[str, float]
    weights: dict[str, float]
    rewards: float | None


def score_card(card: CreditCard, request: RecommendationRequest) -> ScoredCard:
    rewards = annual_rewards(card, request.monthly_spending)
    if rewards is not None and request.monthly_spending is not None:
        annual_spend = sum(request.monthly_spending.model_dump().values()) * 12
        reward_rate = rewards / annual_spend * 100
    else:
        # Without spending data only compare the unconditional base rate.
        reward_rate = category_rate(card, "other")
    rates = {effective_percent(r) for r in card.reward_rules}
    components = {
        "rewards_fit": min(1, reward_rate / REWARD_TARGET_PERCENT),
        "annual_fee_fit": 1 / (1 + card.annual_fee / FEE_SCALE),
        "goal_fit": goal_fit(card, request.primary_goal),
        "travel_fit": (1.0 if card.foreign_transaction_fee_percent == 0 else 0.25)
        if request.primary_goal == PrimaryGoal.TRAVEL or request.wants_no_foreign_transaction_fee
        else 1.0,
        "intro_apr_fit": min(1, (card.intro_purchase_apr_months or 0) / INTRO_TARGET_MONTHS)
        if request.intro_apr_priority or request.primary_goal == PrimaryGoal.INTRO_APR
        else 1.0,
        "simplicity_fit": (1.0 if len(rates) <= 1 else 0.5)
        if request.prefers_simple_rewards
        else 1.0,
        "student_fit": float(card.card_type == CardType.STUDENT) if request.student else 1.0,
        "credit_profile_fit": credit_fit(card, request),
    }
    weights = GOAL_WEIGHTS[request.primary_goal]
    score = sum(components[key] * weight for key, weight in weights.items()) * 100
    return ScoredCard(card, round(score, 2), components, weights, rewards)
