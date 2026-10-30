import json
from pathlib import Path
from typing import Any

import httpx


class SixtySevenCreditProvider:
    """Fetch only during explicit ingestion, never in recommendation requests."""

    endpoint = "https://67.credit/api/v1/cards.json"

    def __init__(self, snapshot: Path | None = None) -> None:
        self.snapshot = snapshot

    async def get_cards(self) -> list[dict[str, Any]]:
        if self.snapshot:
            payload = json.loads(self.snapshot.read_text(encoding="utf-8"))
        else:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.get(self.endpoint)
                response.raise_for_status()
                payload = response.json()
        if payload.get("meta", {}).get("schemaVersion") != "1":
            raise ValueError("Unsupported provider schema")
        rows = payload.get("cards")
        if not isinstance(rows, list) or not all(isinstance(row, dict) for row in rows):
            raise ValueError("Invalid provider card list")
        return rows
