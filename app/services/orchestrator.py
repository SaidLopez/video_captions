import asyncio
from pathlib import Path
from typing import Optional

from app.models import TaskStatusEnum
from app.schemas import CaptionConfig
from app.services.transcription import get_transcription_service
from app.services.video_processor import get_video_processor
from app.services.storage import get_storage_service
from app.services.task_manager import get_task_manager
from app.core.logging import get_logger
from app.core.exceptions import VideoProcessingError

logger = get_logger(__name__)


class CaptionOrchestrator:
    def __init__(self):
        self.transcription_service = get_transcription_service()
        self.video_processor = get_video_processor()
        self.storage_service = get_storage_service()
        self.task_manager = get_task_manager()
    
    async def process_video(
        self,
        task_id: str,
        video_path: Path,
        config: CaptionConfig
    ) -> str:
        try:
            await self.task_manager.update_task(
                task_id,
                status=TaskStatusEnum.PROCESSING,
                progress=5.0,
                message="Starting video processing"
            )
            
            audio_path = self.storage_service.get_temp_path(f"{task_id}.wav")
            await self.video_processor.extract_audio(video_path, audio_path)
            
            await self.task_manager.update_task(
                task_id,
                status=TaskStatusEnum.TRANSCRIBING,
                progress=20.0,
                message="Transcribing audio"
            )
            
            transcription = await self.transcription_service.transcribe(audio_path)
            
            await self.task_manager.update_task(
                task_id,
                progress=60.0,
                message="Transcription complete"
            )
            
            await self.storage_service.delete_file(audio_path)
            
            await self.task_manager.update_task(
                task_id,
                status=TaskStatusEnum.RENDERING,
                progress=70.0,
                message="Rendering captions"
            )
            
            output_path = self.storage_service.get_output_path(video_path.name)
            
            await self.video_processor.add_captions(
                video_path,
                output_path,
                transcription,
                config
            )
            
            await self.task_manager.update_task(
                task_id,
                status=TaskStatusEnum.COMPLETED,
                progress=100.0,
                message="Processing complete",
                output_path=str(output_path),
                result_url=f"/api/v1/videos/download/{output_path.name}"
            )
            
            logger.info("video_processing_complete", task_id=task_id, output=str(output_path))
            
            return str(output_path)
            
        except Exception as e:
            logger.error("video_processing_failed", task_id=task_id, error=str(e))
            await self.task_manager.update_task(
                task_id,
                status=TaskStatusEnum.FAILED,
                error=str(e),
                message="Processing failed"
            )
            raise VideoProcessingError(f"Video processing failed: {str(e)}")


_orchestrator: Optional[CaptionOrchestrator] = None


def get_caption_orchestrator() -> CaptionOrchestrator:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = CaptionOrchestrator()
    return _orchestrator
