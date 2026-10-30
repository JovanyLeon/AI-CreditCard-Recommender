import math

import pytest

from app.domain.card import CreditCard
from app.domain.preferences import MonthlySpending, RecommendationRequest
from app.services.card_repository import CardRepository
from app.services.filters import eligible
from app.services.recommender import recommend
from app.services.scoring import GOAL_WEIGHTS, annual_rewards


def request(**changes: object) -> RecommendationRequest:
    return RecommendationRequest.model_validate({"primary_goal": "cash_back", **changes})


def fixture_card(**changes: object) -> CreditCard:
    base = CardRepository().all()[0].model_dump()
    return CreditCard.model_validate({**base, "id": "fixture", **changes})


@pytest.mark.parametrize(
    "card_changes, prefs",
    [
        ({"annual_fee": 95}, {"max_annual_fee": 0}),
        ({"issuer": "Chase"}, {"issuer_exclusions": [" CHASE "]}),
        ({"foreign_transaction_fee_percent": 3}, {"wants_no_foreign_transaction_fee": True}),
        ({"foreign_transaction_fee_percent": None}, {"wants_no_foreign_transaction_fee": True}),
        ({"active": False}, {}),
        ({"card_type": "business"}, {}),
        ({"card_type": "student"}, {"student": False}),
    ],
)
def test_hard_filters(card_changes: dict[str, object], prefs: dict[str, object]) -> None:
    assert not eligible(fixture_card(**card_changes), request(**prefs))


def test_grocery_heavy_profile_favors_groceries() -> None:
    grocery = fixture_card(id="grocery", reward_rules=[{"category": "groceries", "rate": 3}])
    gas = fixture_card(id="gas", reward_rules=[{"category": "gas", "rate": 3}])
    result = recommend(request(monthly_spending={"groceries": 500}), [gas, grocery])
    assert result.recommendations[0].card.id == "grocery"
    assert result.recommendations[0].estimated_annual_rewards == 180


def test_travel_changes_ranking() -> None:
    cards = CardRepository().all()
    assert recommend(request(primary_goal="travel"), cards).recommendations[0].card.id == "venture"
    assert recommend(request(), cards).recommendations[0].card.id != "venture"


def test_no_fee_improves_score() -> None:
    free = fixture_card(id="free", annual_fee=0)
    paid = fixture_card(id="paid", annual_fee=95)
    assert recommend(request(), [paid, free]).recommendations[0].card.id == "free"


def test_stable_ties_top_n_and_repeatability() -> None:
    cards = [fixture_card(id="z"), fixture_card(id="a"), fixture_card(id="b")]
    first = recommend(request(top_n=2), cards)
    assert first == recommend(request(top_n=2), list(reversed(cards)))
    assert [r.card.id for r in first.recommendations] == ["a", "b"]


@pytest.mark.parametrize("goal", list(GOAL_WEIGHTS))
def test_score_ranges_weights_and_sorting(goal: str) -> None:
    result = recommend(request(primary_goal=goal, student=True, top_n=20), CardRepository().all())
    scores = [r.score for r in result.recommendations]
    assert scores == sorted(scores, reverse=True)
    for entry in result.recommendations:
        assert 0 <= entry.score <= 100
        assert all(0 <= s <= 100 for s in entry.score_breakdown.values())
        assert math.isclose(sum(entry.score_weights.values()), 1)
        assert entry.score == pytest.approx(
            sum(entry.score_breakdown[k] * w for k, w in entry.score_weights.items()), abs=0.02
        )


def test_empty_and_optional_inputs() -> None:
    assert not recommend(request(max_annual_fee=0), [fixture_card(annual_fee=95)]).recommendations
    for spending in (None, {}):
        result = recommend(request(monthly_spending=spending, top_n=20), [fixture_card()])
        assert len(result.recommendations) == 1
        assert result.recommendations[0].estimated_annual_rewards is None


def test_reward_caps_and_point_values() -> None:
    card = fixture_card(
        reward_rules=[
            {"category": "all", "rate": 1},
            {"category": "groceries", "rate": 3, "annual_cap": 6000},
        ]
    )
    assert annual_rewards(card, MonthlySpending(groceries=1000)) == 240
    miles = fixture_card(
        reward_rules=[{"category": "all", "rate": 2, "unit": "miles", "point_value": 0.01}]
    )
    assert annual_rewards(miles, MonthlySpending(other=1000)) == 240


def test_student_conflict_never_silently_relaxed() -> None:
    result = recommend(request(primary_goal="student", student=False), CardRepository().all())
    assert result.recommendations == []
