# app/core/config.py
from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache

class Settings(BaseSettings):
    PROJECT_NAME: str
    DATABASE_URL: str
    
    # JWT 설정
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS 설정
    CORS_ORIGINS: str
    
    # Azure Speech Services
    AZURE_SPEECH_KEY: str
    AZURE_SPEECH_REGION: str
    AZURE_SPEECH_LANGUAGE: str
    
    # Azure OpenAI
    AZURE_OPENAI_KEY: str
    AZURE_OPENAI_ENDPOINT: str
    AZURE_OPENAI_MODEL_DEPLOYMENT_NAME: str
    AZURE_OPENAI_API_VERSION: str
    
    # Azure Storage
    AZURE_STORAGE_ACCOUNT_NAME: str
    AZURE_STORAGE_KEY: str
    AZURE_STORAGE_CONNECTION_STRING: str
    
    # Azure Storage Containers
    AZURE_STORAGE_CONTAINER_AUDIO: str = "audio"
    AZURE_STORAGE_CONTAINER_SKETCHES: str = "sketches"
    AZURE_STORAGE_CONTAINER_GENERATED: str = "generated"
    
    @property
    def CORS_ORIGINS_LIST(self) -> list:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    class Config:
        case_sensitive = True
        env_file = ".env"  # 환경변수 파일 설정

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()