from pathlib import Path

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env", extra="ignore"
    )
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    enable_openai: bool = False
    openai_api_key: SecretStr = SecretStr("")
    openai_model: str = ""

    @property
    def ai_configured(self) -> bool:
        return bool(
            self.enable_openai and self.openai_api_key.get_secret_value() and self.openai_model
        )


settings = Settings()
