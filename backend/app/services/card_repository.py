import json
from pathlib import Path

from pydantic import TypeAdapter

from app.domain.card import CreditCard

DATA_DIRECTORY = Path(__file__).resolve().parents[1] / "data"


class CardRepository:
    def __init__(self, path: Path = DATA_DIRECTORY / "cards.json") -> None:
        self._cards = TypeAdapter(list[CreditCard]).validate_python(
            json.loads(path.read_text(encoding="utf-8"))
        )
        if not self._cards:
            raise ValueError("The card catalog is empty")
        if len({c.id for c in self._cards}) != len(self._cards):
            raise ValueError("Duplicate card IDs")

    def all(self) -> list[CreditCard]:
        return [c.model_copy(deep=True) for c in self._cards]

    def get(self, card_id: str) -> CreditCard | None:
        return next((c for c in self.all() if c.id == card_id), None)
