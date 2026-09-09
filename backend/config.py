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
    # Public base URL of this API, used to build absolute URLs for saved upload
    # files. Empty means "serve them relative", which is correct when the
    # frontend proxies /uploads to this service.
    PUBLIC_BASE_URL: str = ""
    HUGGINGFACE_API_TOKEN: str
    HUGGINGFACE_MODEL_URL: str
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "gpt-4o-mini"
    LLM_API_URL: str = "https://api.openai.com/v1/chat/completions"
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_BOT_USERNAME: str = ""
    TELEGRAM_WEBHOOK_SECRET: str = ""
    GOOGLE_PLACES_API_KEY: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
