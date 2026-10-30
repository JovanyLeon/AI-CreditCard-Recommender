from app.domain.card import CardType, CreditCard, CreditProfile
from app.domain.preferences import PrimaryGoal, RecommendationRequest


def eligible(card: CreditCard, request: RecommendationRequest) -> bool:
    if not card.active or card.card_type == CardType.BUSINESS:
        return False
    if request.max_annual_fee is not None and card.annual_fee > request.max_annual_fee:
        return False
    if request.wants_no_foreign_transaction_fee and card.foreign_transaction_fee_percent != 0:
        return False
    if card.issuer.casefold() in request.issuer_exclusions:
        return False
    if request.primary_goal == PrimaryGoal.STUDENT:
        return card.card_type == CardType.STUDENT and request.student is not False
    if card.card_type == CardType.STUDENT and request.student is not True:
        return False
    if card.card_type == CardType.SECURED:
        return request.primary_goal == PrimaryGoal.BUILD_CREDIT or request.credit_profile in (
            CreditProfile.NEW,
            CreditProfile.FAIR,
        )
    return True
