# translator_agent/config.py
from typing import Optional
from pydantic import Field, AliasChoices
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Read from .env or environment variables
    openai_api_key: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("OPENAI_API_KEY")
    )
    model: str = Field(
        default="gpt-4o-mini",
        validation_alias=AliasChoices("TRANSLATOR_DEFAULT_MODEL")
    )
    max_chunk_tokens: int = 3000
    concurrency: int = 4
    out_format: str = "docx"   # or "pdf"
    fa_digits: bool = False

    # Pydantic v2 way to load .env
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

settings = Settings()
