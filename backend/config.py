from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    # Comma-separated list of exact browser origins allowed to call the API
    # (e.g. "https://ohas-web.onrender.com,http://localhost:5173"). In local
    # dev the default covers the Vite server; production sets the real value.
    CORS_ORIGINS: str = "http://localhost:5173"
    HUGGINGFACE_API_TOKEN: str
    HUGGINGFACE_MODEL_URL: str
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "gpt-4o-mini"
    LLM_API_URL: str = "https://api.openai.com/v1/chat/completions"
    GOOGLE_PLACES_API_KEY: str = ""
    # Root log level for the app's own loggers. Set LOG_LEVEL=DEBUG to also see
    # outgoing request payloads (e.g. the Google Places search body).
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
