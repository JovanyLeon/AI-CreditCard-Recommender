import pytest
from pydantic import ValidationError

from app.domain.preferences import RecommendationRequest


@pytest.mark.parametrize(
    "change",
    [
        {"monthly_spending": {"groceries": -5}},
        {"max_annual_fee": -1},
        {"primary_goal": "rich"},
        {"credit_profile": "perfect"},
        {"top_n": 0},
        {"top_n": 21},
        {"monthly_spending": {"groceries": float("nan")}},
        {"issuer_exclusions": [" "]},
        {"unknown_field": True},
    ],
)
def test_bad_preferences(change: dict[str, object]) -> None:
    with pytest.raises(ValidationError):
        RecommendationRequest.model_validate({"primary_goal": "cash_back", **change})


def test_optional_spending_and_normalized_exclusions() -> None:
    request = RecommendationRequest(
        primary_goal="cash_back", issuer_exclusions=[" Chase ", "CHASE"]
    )
    assert request.monthly_spending is None
    assert request.credit_profile == "unknown"
    assert request.issuer_exclusions == ["chase"]
