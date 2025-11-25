from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, status
from fastapi.responses import FileResponse
from pathlib import Path
from typing import Optional
import json
import asyncio

from app.schemas import (
    CaptionConfig,
    CaptionStyle,
    CaptionPosition,
    TaskResponse,
    TaskStatus,
)
from app.models import TaskStatusEnum
from app.services.storage import get_storage_service
from app.services.task_manager import get_task_manager
from app.services.orchestrator import get_caption_orchestrator
from app.core.config import get_settings
from app.core.logging import get_logger
from app.core.exceptions import (
    InvalidFileTypeError,
    FileTooLargeError,
    TaskNotFoundError,
    VideoNotFoundError,
)

logger = get_logger(__name__)
router = APIRouter(prefix="/videos", tags=["videos"])


def validate_file(file: UploadFile) -> None:
    settings = get_settings()
    
    if file.filename:
        ext = Path(file.filename).suffix.lower().lstrip(".")
        if ext not in settings.allowed_extensions:
            raise InvalidFileTypeError(
                f"File type '{ext}' not allowed. Allowed types: {settings.allowed_extensions}"
            )


@router.post(
    "/caption",
    response_model=TaskResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Add captions to a video",
    description="Upload a video file and add TikTok/social media style captions"
)
async def create_captioned_video(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(..., description="Video file to process"),
    style: CaptionStyle = Form(default=CaptionStyle.TIKTOK),
    position: CaptionPosition = Form(default=CaptionPosition.BOTTOM),
    font_size: int = Form(default=48, ge=12, le=120),
    font_color: str = Form(default="#FFFFFF"),
    stroke_color: str = Form(default="#000000"),
    stroke_width: int = Form(default=3, ge=0, le=10),
    highlight_color: str = Form(default="#FFFF00"),
    highlight_current_word: bool = Form(default=True),
    max_words_per_line: int = Form(default=5, ge=1, le=15),
):
    validate_file(video)
    
    config = CaptionConfig(
        style=style,
        position=position,
        font_size=font_size,
        font_color=font_color,
        stroke_color=stroke_color,
        stroke_width=stroke_width,
        highlight_color=highlight_color,
        highlight_current_word=highlight_current_word,
        max_words_per_line=max_words_per_line,
    )
    
    storage = get_storage_service()
    task_manager = get_task_manager()
    orchestrator = get_caption_orchestrator()
    
    video_path = await storage.save_upload(video.file, video.filename)
    
    task = await task_manager.create_task(
        input_path=str(video_path),
        caption_config=config.model_dump()
    )
    
    background_tasks.add_task(
        orchestrator.process_video,
        task.id,
        video_path,
        config
    )
    
    logger.info("caption_task_created", task_id=task.id, filename=video.filename)
    
    return TaskResponse(
        task_id=task.id,
        status=TaskStatus(task.status.value),
        progress=task.progress,
        message="Video upload successful. Processing started.",
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


@router.get(
    "/tasks/{task_id}",
    response_model=TaskResponse,
    summary="Get task status",
    description="Check the status of a video captioning task"
)
async def get_task_status(task_id: str):
    task_manager = get_task_manager()
    task = await task_manager.get_task(task_id)
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found"
        )
    
    return TaskResponse(
        task_id=task.id,
        status=TaskStatus(task.status.value),
        progress=task.progress,
        message=task.message,
        created_at=task.created_at,
        updated_at=task.updated_at,
        result_url=task.result_url,
        error=task.error,
    )


@router.get(
    "/download/{filename}",
    summary="Download processed video",
    description="Download a captioned video file"
)
async def download_video(filename: str):
    settings = get_settings()
    file_path = Path(settings.output_dir) / filename
    
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video file not found"
        )
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="video/mp4"
    )


@router.get(
    "/styles",
    summary="Get available caption styles",
    description="List all available caption style presets"
)
async def get_caption_styles():
    return {
        "styles": [
            {
                "name": style.value,
                "description": f"{style.value.replace('_', ' ').title()} style captions"
            }
            for style in CaptionStyle
        ],
        "positions": [pos.value for pos in CaptionPosition],
    }
