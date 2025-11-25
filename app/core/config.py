from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache
from typing import Optional
import os


class Settings(BaseSettings):
    app_name: str = "Video Captions API"
    app_version: str = "1.0.0"
    debug: bool = False
    
    api_prefix: str = "/api/v1"
    
    upload_dir: str = Field(default="uploads")
    output_dir: str = Field(default="outputs")
    temp_dir: str = Field(default="temp")
    max_file_size_mb: int = 500
    allowed_extensions: list[str] = ["mp4", "mov", "avi", "mkv", "webm"]
    
    whisper_model: str = "base"
    
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/0"
    
    s3_bucket: Optional[str] = None
    s3_region: Optional[str] = None
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
