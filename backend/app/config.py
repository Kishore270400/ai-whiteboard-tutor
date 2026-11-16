from pydantic_settings import BaseSettings, SettingsConfigDict


DEFAULT_CORS_ORIGINS = (
    "http://localhost:3000,"
    "http://localhost:3001,"
    "http://127.0.0.1:3000,"
    "http://127.0.0.1:3001"
)


class Settings(BaseSettings):
    app_name: str = "AI Whiteboard Tutor API"
    frontend_url: str = "http://localhost:3000"
    # Comma-separated origins (string avoids pydantic-settings JSON list parsing).
    cors_origins: str = DEFAULT_CORS_ORIGINS
    openai_api_key: str = ""
    openai_model: str = "gpt-4.1-mini"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def allowed_origins(self) -> list[str]:
        origins = [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]
        if self.frontend_url and self.frontend_url not in origins:
            origins.append(self.frontend_url)
        return origins


settings = Settings()
