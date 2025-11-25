from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List
from enum import Enum
import uuid


class TaskStatusEnum(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    TRANSCRIBING = "transcribing"
    RENDERING = "rendering"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class TranscriptionSegment:
    start: float
    end: float
    text: str
    words: List[dict] = field(default_factory=list)


@dataclass
class Transcription:
    segments: List[TranscriptionSegment]
    language: str
    duration: float


@dataclass
class VideoTask:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    status: TaskStatusEnum = TaskStatusEnum.PENDING
    progress: float = 0.0
    message: Optional[str] = None
    input_path: Optional[str] = None
    output_path: Optional[str] = None
    result_url: Optional[str] = None
    error: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    caption_config: Optional[dict] = None
    transcription: Optional[Transcription] = None
