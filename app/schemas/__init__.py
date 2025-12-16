from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime


class CaptionStyle(str, Enum):
    TIKTOK = "tiktok"
    INSTAGRAM = "instagram"
    YOUTUBE_SHORTS = "youtube_shorts"
    MINIMAL = "minimal"
    BOLD = "bold"
    NEON = "neon"


class CaptionPosition(str, Enum):
    TOP = "top"
    CENTER = "center"
    BOTTOM = "bottom"


class FontWeight(str, Enum):
    NORMAL = "normal"
    BOLD = "bold"
    BLACK = "black"


class CaptionConfig(BaseModel):
    style: CaptionStyle = Field(default=CaptionStyle.TIKTOK)
    position: CaptionPosition = Field(default=CaptionPosition.BOTTOM)
    font_size: int = Field(default=48, ge=12, le=120)
    font_color: str = Field(default="#FFFFFF")
    font_weight: FontWeight = Field(default=FontWeight.BOLD)
    stroke_color: str = Field(default="#000000")
    stroke_width: int = Field(default=3, ge=0, le=10)
    background_color: Optional[str] = Field(default=None)
    background_opacity: float = Field(default=0.7, ge=0, le=1)
    highlight_color: str = Field(default="#FFFF00")
    highlight_current_word: bool = Field(default=True)
    max_words_per_line: int = Field(default=5, ge=1, le=15)
    animation: bool = Field(default=True)


class VideoUploadRequest(BaseModel):
    caption_config: Optional[CaptionConfig] = Field(default_factory=CaptionConfig)


class TaskStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    TRANSCRIBING = "transcribing"
    RENDERING = "rendering"
    COMPLETED = "completed"
    FAILED = "failed"


class TaskResponse(BaseModel):
    task_id: str
    status: TaskStatus
    progress: float = Field(default=0.0, ge=0, le=100)
    message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    result_url: Optional[str] = None
    error: Optional[str] = None


class TranscriptionSegmentSchema(BaseModel):
    start: float
    end: float
    text: str
    words: Optional[list] = Field(default_factory=list)


class EditTranscriptionRequest(BaseModel):
    task_id: str = Field(..., description="Original task ID to retrieve transcription from")
    segments: list[TranscriptionSegmentSchema] = Field(..., description="Edited transcription segments")
    caption_config: Optional[CaptionConfig] = Field(default_factory=CaptionConfig)


class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: datetime
