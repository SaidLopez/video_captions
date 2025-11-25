from fastapi import APIRouter
from datetime import datetime

from app.schemas import HealthResponse
from app.core.config import get_settings

router = APIRouter(tags=["health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description="Check if the API is running"
)
async def health_check():
    settings = get_settings()
    return HealthResponse(
        status="healthy",
        version=settings.app_version,
        timestamp=datetime.utcnow()
    )


@router.get(
    "/ready",
    summary="Readiness check",
    description="Check if the API is ready to accept requests"
)
async def readiness_check():
    return {"status": "ready"}
