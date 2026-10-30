import json
import logging
from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.api.ai import router as ai_router
from app.api.cards import router as cards_router
from app.api.recommendations import router as recommendations_router
from app.core.config import settings

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("cardmatch")

app = FastAPI(title="CardMatch API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
app.include_router(cards_router)
app.include_router(ai_router)
app.include_router(recommendations_router)


@app.middleware("http")
async def request_log(
    request: Request, call_next: Callable[[Request], Awaitable[Response]]
) -> Response:
    response = await call_next(request)
    route = request.scope.get("route")
    logger.info(
        json.dumps(
            {
                "event": "http",
                "path": getattr(route, "path", "unmatched"),
                "status": response.status_code,
            }
        )
    )
    return response


@app.get("/api/v1/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
