from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.logging import setup_logging, get_logger
from app.core.exceptions import VideoCaptionException
from app.middleware.logging import RequestLoggingMiddleware
from app.middleware.error_handler import (
    video_caption_exception_handler,
    validation_exception_handler,
    generic_exception_handler,
)

settings = get_settings()
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("application_startup", app_name=settings.app_name)
    yield
    logger.info("application_shutdown")


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Enterprise-grade API for adding TikTok/social media style captions to videos",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    app.add_middleware(RequestLoggingMiddleware)
    
    app.add_exception_handler(VideoCaptionException, video_caption_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)
    
    app.include_router(api_router, prefix=settings.api_prefix)
    
    return app


app = create_application()
