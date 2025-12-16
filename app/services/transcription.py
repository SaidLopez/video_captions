import whisper
import torch
import asyncio
from pathlib import Path
from typing import Optional
from app.models import Transcription, TranscriptionSegment
from app.core.logging import get_logger
from app.core.exceptions import TranscriptionError
from app.core.config import get_settings

logger = get_logger(__name__)


class TranscriptionService:
    def __init__(self, model_name: Optional[str] = None):
        settings = get_settings()
        self.model_name = model_name or settings.whisper_model
        self._model = None
    
    @property
    def model(self):
        if self._model is None:
            logger.info("loading_whisper_model", model=self.model_name)
            device = "cuda" if torch.cuda.is_available() else "cpu"
            self._model = whisper.load_model(self.model_name, device=device)
            logger.info("whisper_model_loaded", model=self.model_name, device=device)
        return self._model
    
    async def transcribe(self, audio_path: Path, language: Optional[str] = None) -> Transcription:
        try:
            logger.info("starting_transcription", audio_path=str(audio_path))
            
            def _run_transcribe():
                return self.model.transcribe(
                    str(audio_path),
                    language=language,
                    word_timestamps=True,
                    verbose=False
                )

            result = await asyncio.to_thread(_run_transcribe)
            
            segments = []
            for seg in result["segments"]:
                words = []
                if "words" in seg:
                    words = [
                        {
                            "word": w["word"].strip(),
                            "start": w["start"],
                            "end": w["end"]
                        }
                        for w in seg["words"]
                    ]
                
                segments.append(TranscriptionSegment(
                    start=seg["start"],
                    end=seg["end"],
                    text=seg["text"].strip(),
                    words=words
                ))
            
            transcription = Transcription(
                segments=segments,
                language=result.get("language", "en"),
                duration=segments[-1].end if segments else 0.0
            )
            
            logger.info(
                "transcription_completed",
                segments_count=len(segments),
                language=transcription.language,
                duration=transcription.duration
            )
            
            return transcription
            
        except Exception as e:
            logger.error("transcription_failed", error=str(e))
            raise TranscriptionError(f"Failed to transcribe audio: {str(e)}")


_transcription_service: Optional[TranscriptionService] = None


def get_transcription_service() -> TranscriptionService:
    global _transcription_service
    if _transcription_service is None:
        _transcription_service = TranscriptionService()
    return _transcription_service
