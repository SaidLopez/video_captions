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
    EditTranscriptionRequest,
)
from app.models import TaskStatusEnum
from app.services.storage import get_storage_service
from app.services.task_manager import get_task_manager
from app.services.task_manager import get_task_manager
from app.services.orchestrator import get_caption_orchestrator
from app.services.video_processor import get_video_processor, CaptionStyler
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

    # Determine media type based on file extension
    ext = file_path.suffix.lower()
    media_type_map = {
        ".mp4": "video/mp4",
        ".mov": "video/quicktime",
        ".avi": "video/x-msvideo",
        ".mkv": "video/x-matroska",
        ".webm": "video/webm",
    }
    media_type = media_type_map.get(ext, "video/mp4")

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type=media_type
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
                "description": f"{style.value.replace('_', ' ').title()} style captions",
                "config": CaptionStyler.STYLE_PRESETS[style]
            }
            for style in CaptionStyle
        ],
        "positions": [pos.value for pos in CaptionPosition],
    }


@router.get(
    "/tasks/{task_id}/transcription",
    summary="Get transcription for a task",
    description="Retrieve the transcription data from a completed task for editing"
)
async def get_task_transcription(task_id: str):
    task_manager = get_task_manager()
    task = await task_manager.get_task(task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found"
        )

    if not task.transcription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No transcription available for this task"
        )

    return {
        "task_id": task_id,
        "language": task.transcription.language,
        "duration": task.transcription.duration,
        "segments": [
            {
                "start": seg.start,
                "end": seg.end,
                "text": seg.text,
                "words": seg.words
            }
            for seg in task.transcription.segments
        ]
    }


@router.post(
    "/reprocess",
    response_model=TaskResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Reprocess video with edited transcription",
    description="Submit edited transcription and caption config to reprocess an existing video"
)
async def reprocess_video(
    background_tasks: BackgroundTasks,
    request: EditTranscriptionRequest
):
    orchestrator = get_caption_orchestrator()
    task_manager = get_task_manager()

    try:
        # Get original task to extract video path
        original_task = await task_manager.get_task(request.task_id)
        if not original_task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task {request.task_id} not found"
            )

        if not original_task.input_path:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Original task does not have a video file"
            )

        # Use provided config or default
        caption_config = request.caption_config or CaptionConfig()

        # Create new task for the reprocess
        new_task = await task_manager.create_task(
            input_path=original_task.input_path,
            caption_config=caption_config.model_dump()
        )

        # Prepare segments data for reprocessing
        segments_data = [seg.model_dump() for seg in request.segments]

        # Add rendering to background tasks
        background_tasks.add_task(
            orchestrator.reprocess_with_edited_transcription,
            new_task.id,
            segments_data,
            caption_config
        )

        logger.info("video_reprocess_initiated", original_task_id=request.task_id, new_task_id=new_task.id)

        return TaskResponse(
            task_id=new_task.id,
            status=TaskStatus(new_task.status.value),
            progress=new_task.progress,
            message="Reprocessing started with edited transcription",
            created_at=new_task.created_at,
            updated_at=new_task.updated_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("reprocess_request_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Reprocessing failed: {str(e)}"
        )


@router.get(
    "/stream/{task_id}",
    summary="Stream source video",
    description="Stream the original uploaded video for editing"
)
async def stream_source_video(task_id: str):
    task_manager = get_task_manager()
    task = await task_manager.get_task(task_id)
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found"
        )
        
    if not task.input_path or not Path(task.input_path).exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source video not found"
        )
    
    path = Path(task.input_path)
    
    # Determine media type based on file extension
    ext = path.suffix.lower()
    media_type_map = {
        ".mp4": "video/mp4",
        ".mov": "video/quicktime",
        ".avi": "video/x-msvideo",
        ".mkv": "video/x-matroska",
        ".webm": "video/webm",
    }
    media_type = media_type_map.get(ext, "video/mp4")
    
    return FileResponse(
        path=path,
        media_type=media_type,
        filename=path.name
    )


@router.get(
    "/tasks/{task_id}/thumbnail",
    summary="Get video thumbnail",
    description="Get a representative thumbnail from the source video"
)
async def get_video_thumbnail(task_id: str):
    task_manager = get_task_manager()
    task = await task_manager.get_task(task_id)
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found"
        )
        
    if not task.input_path or not Path(task.input_path).exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source video not found"
        )
    
    # Check if thumbnail already exists
    video_path = Path(task.input_path)
    thumbnail_path = video_path.parent / f"{video_path.stem}_thumb.jpg"
    
    if not thumbnail_path.exists():
        # Generate thumbnail
        video_processor = get_video_processor()
        try:
            # Generate thumbnail at 10% of duration or 1 second, whichever is safe
            # For now, just use 1.0s or 0.0s
            await video_processor.generate_thumbnail(video_path, thumbnail_path, time=1.0)
        except Exception as e:
            logger.error(f"Failed to generate thumbnail for task {task_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate thumbnail"
            )
    
    return FileResponse(
        path=thumbnail_path,
        media_type="image/jpeg",
        filename=thumbnail_path.name
    )
