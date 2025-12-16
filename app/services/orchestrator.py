import asyncio
from pathlib import Path
from typing import Optional

from app.models import TaskStatusEnum, Transcription, TranscriptionSegment
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
                status=TaskStatusEnum.COMPLETED,
                progress=100.0,
                message="Transcription complete, ready for editing",
                transcription=transcription
            )
            
            await self.storage_service.delete_file(audio_path)
            
            logger.info("video_transcription_complete", task_id=task_id)
            
            return str(video_path)
            
        except Exception as e:
            logger.error("video_processing_failed", task_id=task_id, error=str(e))
            await self.task_manager.update_task(
                task_id,
                status=TaskStatusEnum.FAILED,
                error=str(e),
                message="Processing failed"
            )
            raise VideoProcessingError(f"Video processing failed: {str(e)}")

    async def reprocess_with_edited_transcription(
        self,
        task_id: str,
        segments_data: list[dict],
        new_config: CaptionConfig
    ) -> str:
        """Re-process video with edited transcription and updated caption config"""
        try:
            # Get original task
            original_task = await self.task_manager.get_task(task_id)
            if not original_task:
                raise VideoProcessingError(f"Original task {task_id} not found")

            if not original_task.input_path:
                raise VideoProcessingError("Original video path not found in task")

            original_video_path = Path(original_task.input_path)
            if not original_video_path.exists():
                raise VideoProcessingError(f"Original video file not found: {original_video_path}")

            # Create new task for reprocessing
            new_task = await self.task_manager.create_task(
                input_path=str(original_video_path),
                caption_config=new_config.model_dump()
            )

            # Convert segments data to Transcription object
            segments = [
                TranscriptionSegment(
                    start=seg["start"],
                    end=seg["end"],
                    text=seg["text"],
                    words=seg.get("words", [])
                )
                for seg in segments_data
            ]

            # Get language from original transcription if available
            language = "en"
            if original_task.transcription:
                language = original_task.transcription.language

            # Determine duration from segments
            duration = max([seg["end"] for seg in segments_data]) if segments_data else 0

            edited_transcription = Transcription(
                segments=segments,
                language=language,
                duration=duration
            )

            await self.task_manager.update_task(
                new_task.id,
                status=TaskStatusEnum.RENDERING,
                progress=70.0,
                message="Rendering captions with edited transcription",
                transcription=edited_transcription
            )

            output_path = self.storage_service.get_output_path(original_video_path.name)

            await self.video_processor.add_captions(
                original_video_path,
                output_path,
                edited_transcription,
                new_config
            )

            await self.task_manager.update_task(
                new_task.id,
                status=TaskStatusEnum.COMPLETED,
                progress=100.0,
                message="Reprocessing complete",
                output_path=str(output_path),
                result_url=f"/api/v1/videos/download/{output_path.name}"
            )

            logger.info("video_reprocessing_complete", task_id=new_task.id, output=str(output_path))

            return new_task.id

        except Exception as e:
            logger.error("video_reprocessing_failed", task_id=task_id, error=str(e))
            raise VideoProcessingError(f"Video reprocessing failed: {str(e)}")


_orchestrator: Optional[CaptionOrchestrator] = None


def get_caption_orchestrator() -> CaptionOrchestrator:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = CaptionOrchestrator()
    return _orchestrator
