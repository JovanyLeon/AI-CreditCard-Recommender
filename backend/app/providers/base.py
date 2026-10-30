from typing import Any, Protocol


class CardDataProvider(Protocol):
    async def get_cards(self) -> list[dict[str, Any]]: ...
