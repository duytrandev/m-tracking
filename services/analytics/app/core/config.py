"""
Application configuration
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings"""

    # Application
    ENVIRONMENT: str = "development"
    PORT: int = 5000

    # Security
    INTERNAL_API_KEY: str

    # Database
    DATABASE_URL: str

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # LLM APIs
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""

    # Backend Service
    BACKEND_SERVICE_URL: str = "http://localhost:4000"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:4000"]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
