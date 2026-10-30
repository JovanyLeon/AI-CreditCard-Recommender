from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import repository
from app.domain.card import CreditCard
from app.services.card_repository import CardRepository

router = APIRouter(prefix="/api/v1/cards", tags=["Cards"])


@router.get("")
def cards(repo: Annotated[CardRepository, Depends(repository)]) -> list[CreditCard]:
    return [c for c in repo.all() if c.active and c.card_type != "business"]


@router.get("/{card_id}")
def detail(card_id: str, repo: Annotated[CardRepository, Depends(repository)]) -> CreditCard:
    card = repo.get(card_id)
    if card is None or not card.active or card.card_type == "business":
        raise HTTPException(404, "Card not found")
    return card
