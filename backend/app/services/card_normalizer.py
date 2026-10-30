from typing import Any

from app.domain.card import CreditCard


def normalize_card(raw: dict[str, Any], review: dict[str, Any]) -> CreditCard:
    """Overlay issuer-reviewed terms on external identity and provenance.

    Unreviewed rows are intentionally not eligible for the production catalog.
    Provider category/rate fields conflate conditional offers; do not guess.
    """
    return CreditCard.model_validate(
        {
            "id": raw["slug"],
            "name": raw["name"],
            "issuer": raw["issuer"],
            "source_url": raw["url"],
            "source_verified_at": raw["lastVerified"],
            "active": raw["status"] == "active",
            **review,
        }
    )
