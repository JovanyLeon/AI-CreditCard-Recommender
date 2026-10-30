from fastapi.testclient import TestClient

from app.main import app


def test_health() -> None:
    with TestClient(app) as client:
        assert client.get("/api/v1/health").json() == {"status": "ok"}


def test_cors() -> None:
    with TestClient(app) as client:
        response = client.options(
            "/api/v1/health",
            headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "GET"},
        )
        assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
