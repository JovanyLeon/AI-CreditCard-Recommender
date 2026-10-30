from app.domain.card import CardType, CreditCard
from app.domain.preferences import RecommendationRequest
from app.domain.recommendation import RecommendationResponse, RecommendationResult
from app.services.explanations import explain
from app.services.filters import eligible
from app.services.scoring import score_card


def recommend(request: RecommendationRequest, cards: list[CreditCard]) -> RecommendationResponse:
    candidates = [c for c in cards if eligible(c, request)]
    scored = [score_card(c, request) for c in candidates]
    scored.sort(
        key=lambda s: (-s.score, -s.components["rewards_fit"], s.card.annual_fee, s.card.id)
    )
    results: list[RecommendationResult] = []
    for rank, entry in enumerate(scored[: request.top_n], start=1):
        matches, tradeoffs, explanation = explain(entry, request)
        results.append(
            RecommendationResult(
                rank=rank,
                card=entry.card,
                score=entry.score,
                score_breakdown={k: round(v * 100, 2) for k, v in entry.components.items()},
                score_weights=entry.weights,
                matched_preferences=matches,
                tradeoffs=tradeoffs,
                explanation=explanation,
                estimated_annual_rewards=entry.rewards,
                estimated_net_annual_value=round(entry.rewards - entry.card.annual_fee, 2)
                if entry.rewards is not None
                else None,
            )
        )
    notices = [
        "Match scores measure preference fit, not approval odds.",
        "Estimates exclude interest, welcome offers, credits, and portal-only bonuses. "
        "Paying interest may outweigh rewards. Verify current issuer terms.",
    ]
    if request.monthly_spending is None or sum(request.monthly_spending.model_dump().values()) == 0:
        notices.append("No spending supplied: rewards fit uses the base earn rate only.")
    if not results:
        notices.append("No card meets every requirement. Edit a preference to widen your search.")
    return RecommendationResponse(
        preferences=request,
        recommendations=results,
        compared_count=sum(c.active and c.card_type != CardType.BUSINESS for c in cards),
        eligible_count=len(candidates),
        notices=notices,
    )
