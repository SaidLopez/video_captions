from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.exceptions import (
    VideoCaptionException,
    VideoNotFoundError,
    VideoProcessingError,
    TranscriptionError,
    InvalidFileTypeError,
    FileTooLargeError,
    StorageError,
    TaskNotFoundError,
)
from app.core.logging import get_logger

logger = get_logger(__name__)


async def video_caption_exception_handler(request: Request, exc: VideoCaptionException):
    logger.error("video_caption_error", error=exc.message, details=exc.details)
    
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    
    if isinstance(exc, (VideoNotFoundError, TaskNotFoundError)):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(exc, (InvalidFileTypeError, FileTooLargeError)):
        status_code = status.HTTP_400_BAD_REQUEST
    elif isinstance(exc, (VideoProcessingError, TranscriptionError)):
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    elif isinstance(exc, StorageError):
        status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    
    return JSONResponse(
        status_code=status_code,
        content={
            "error": exc.__class__.__name__,
            "message": exc.message,
            "details": exc.details,
        }
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning("validation_error", errors=exc.errors())
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "ValidationError",
            "message": "Request validation failed",
            "details": exc.errors(),
        }
    )


async def generic_exception_handler(request: Request, exc: Exception):
    logger.error("unhandled_exception", error=str(exc), exc_info=True)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred",
        }
    )
