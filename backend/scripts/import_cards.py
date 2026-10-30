"""Run from backend: python -m scripts.import_cards [--refresh]."""

import argparse
import asyncio
import json
from pathlib import Path

from app.providers.base import CardDataProvider
from app.providers.sixty_seven_credit import SixtySevenCreditProvider
from app.services.card_normalizer import normalize_card
from app.services.card_repository import DATA_DIRECTORY, CardRepository


async def ingest(provider: CardDataProvider, reviews_path: Path, output: Path) -> int:
    reviews = json.loads(reviews_path.read_text(encoding="utf-8"))
    raw = await provider.get_cards()
    rows = {row["slug"]: row for row in raw}
    if len(rows) != len(raw):
        raise ValueError("Duplicate IDs in provider data")
    missing = set(reviews) - rows.keys()
    if missing:
        raise ValueError(f"Reviewed cards missing from provider: {sorted(missing)}")
    cards = [normalize_card(rows[slug], review) for slug, review in sorted(reviews.items())]
    temporary = output.with_suffix(".tmp.json")
    temporary.write_text(
        json.dumps([card.model_dump(mode="json") for card in cards], indent=2) + "\n",
        encoding="utf-8",
    )
    CardRepository(temporary)  # Validate the entire catalog before atomic replacement.
    temporary.replace(output)
    return len(cards)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--refresh", action="store_true", help="Fetch live provider data")
    args = parser.parse_args()
    provider = SixtySevenCreditProvider(
        None if args.refresh else DATA_DIRECTORY / "source-67credit.json"
    )
    count = asyncio.run(
        ingest(provider, DATA_DIRECTORY / "reviews.json", DATA_DIRECTORY / "cards.json")
    )
    print(f"Imported {count} reviewed cards. Unreviewed source rows were not published.")
