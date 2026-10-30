from functools import lru_cache

from app.services.card_repository import CardRepository


@lru_cache
def repository() -> CardRepository:
    return CardRepository()
