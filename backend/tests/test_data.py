import asyncio
import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.domain.card import CreditCard
from app.providers.sixty_seven_credit import SixtySevenCreditProvider
from app.services.card_repository import DATA_DIRECTORY, CardRepository
from scripts.import_cards import ingest


def test_snapshot_import_is_reproducible(tmp_path: Path) -> None:
    output = tmp_path / "cards.json"
    count = asyncio.run(
        ingest(
            SixtySevenCreditProvider(DATA_DIRECTORY / "source-67credit.json"),
            DATA_DIRECTORY / "reviews.json",
            output,
        )
    )
    assert count == 6
    assert json.loads(output.read_text()) == json.loads((DATA_DIRECTORY / "cards.json").read_text())


@pytest.mark.parametrize(
    "change",
    [
        {"annual_fee": -1},
        {"annual_fee": float("inf")},
        {"issuer": " "},
        {"source_url": "not-a-url"},
        {"last_verified_at": "2099-01-01"},
        {"card_type": "unknown"},
        {"reward_rules": [{"category": "food", "rate": 3}]},
    ],
)
def test_invalid_card_rejected(change: dict[str, object]) -> None:
    card = CardRepository().all()[0].model_dump()
    with pytest.raises(ValidationError):
        CreditCard.model_validate({**card, **change})


def test_duplicate_ids_rejected(tmp_path: Path) -> None:
    card = CardRepository().all()[0].model_dump(mode="json")
    path = tmp_path / "cards.json"
    path.write_text(json.dumps([card, card]))
    with pytest.raises(ValueError, match="Duplicate"):
        CardRepository(path)


def test_repository_returns_copies() -> None:
    repo = CardRepository()
    repo.all()[0].tags.append("changed")
    assert "changed" not in repo.all()[0].tags
