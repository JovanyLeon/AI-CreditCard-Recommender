from app.domain.card import CardType
from app.domain.preferences import RecommendationRequest
from app.services.scoring import ScoredCard, category_rate


def explain(scored: ScoredCard, request: RecommendationRequest) -> tuple[list[str], list[str], str]:
    card = scored.card
    matches: list[str] = []
    tradeoffs: list[str] = []
    if card.annual_fee == 0:
        matches.append("No annual fee")
    elif request.max_annual_fee is not None:
        matches.append(f"${card.annual_fee:g} annual fee fits your limit")
    if request.primary_goal.value in card.tags:
        matches.append(f"Aligned with your {request.primary_goal.value.replace('_', ' ')} goal")
    if request.monthly_spending:
        categories = sorted(
            request.monthly_spending.model_dump().items(), key=lambda x: (-x[1], x[0])
        )
        for category, amount in categories[:2]:
            if amount > 0 and category_rate(card, category) > 0:
                matches.append(
                    f"Rewards on {category.replace('_', ' ')}, one of your spending categories"
                )
    if card.foreign_transaction_fee_percent == 0:
        matches.append("No foreign transaction fee")
    if card.intro_purchase_apr_months and (
        request.intro_apr_priority or request.primary_goal == "intro_apr"
    ):
        matches.append(f"{card.intro_purchase_apr_months} months of introductory purchase APR")
    if card.card_type == CardType.STUDENT:
        matches.append("Designed for students")
    if card.card_type == CardType.SECURED:
        tradeoffs.append("A security deposit is required")
    if card.annual_fee:
        tradeoffs.append(f"A ${card.annual_fee:g} annual fee reduces net reward value")
    if card.foreign_transaction_fee_percent is None:
        tradeoffs.append("Foreign transaction fees are unverified; check issuer terms")
    elif card.foreign_transaction_fee_percent > 0:
        tradeoffs.append(f"{card.foreign_transaction_fee_percent:g}% foreign transaction fee")
    if request.intro_apr_priority and not card.intro_purchase_apr_months:
        tradeoffs.append("No verified introductory purchase APR in our catalog")
    if scored.components["credit_profile_fit"] < 0.5:
        tradeoffs.append("The issuer's general credit guidance may differ from your profile")
    if scored.rewards is not None and scored.rewards < card.annual_fee:
        tradeoffs.append("Estimated rewards do not cover the annual fee at your spending level")
    tradeoffs.extend(card.data_notes)
    if not matches:
        matches.append("Meets your stated hard constraints")
    strongest = sorted(
        scored.components, key=lambda k: -(scored.components[k] * scored.weights[k])
    )[:2]
    factors = " and ".join(key.replace("_", " ") for key in strongest)
    explanation = f"Its strongest weighted factors are {factors}. {'. '.join(matches[:2])}."
    return matches, tradeoffs, explanation
