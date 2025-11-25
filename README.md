# Video Captions API

Enterprise-grade FastAPI service for adding TikTok/social media style captions to videos.

## Features

- Automatic speech-to-text transcription using OpenAI Whisper
- Multiple caption styles (TikTok, Instagram, YouTube Shorts, etc.)
- Word-by-word highlighting animation
- Customizable fonts, colors, and positioning
- Async background processing
- RESTful API with OpenAPI documentation

## Project Structure

```
video_captions/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   ├── health.py
│   │       │   └── videos.py
│   │       └── router.py
│   ├── core/
│   │   ├── config.py
│   │   ├── exceptions.py
│   │   └── logging.py
│   ├── middleware/
│   │   ├── error_handler.py
│   │   └── logging.py
│   ├── models/
│   │   └── __init__.py
│   ├── schemas/
│   │   └── __init__.py
│   ├── services/
│   │   ├── orchestrator.py
│   │   ├── storage.py
│   │   ├── task_manager.py
│   │   ├── transcription.py
│   │   └── video_processor.py
│   └── main.py
├── requirements.txt
└── README.md
```

## Installation

```bash
pip install -r requirements.txt
```

### System Dependencies

- FFmpeg (required for video processing)
- Python 3.10+

## Usage

### Start the server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### API Endpoints

- `POST /api/v1/videos/caption` - Upload video and add captions
- `GET /api/v1/videos/tasks/{task_id}` - Check processing status
- `GET /api/v1/videos/download/{filename}` - Download processed video
- `GET /api/v1/videos/styles` - List available caption styles
- `GET /api/v1/health` - Health check

### Example Request

```bash
curl -X POST "http://localhost:8000/api/v1/videos/caption" \
  -F "video=@my_video.mp4" \
  -F "style=tiktok" \
  -F "position=bottom" \
  -F "highlight_current_word=true"
```

## Caption Styles

- `tiktok` - Bold white text with green highlight
- `instagram` - Clean style with background box
- `youtube_shorts` - Impact font with gold highlight
- `minimal` - Subtle, clean captions
- `bold` - Large yellow text with red highlight
- `neon` - Cyan text with magenta stroke

## Configuration

Set environment variables or create a `.env` file:

```
WHISPER_MODEL=base  # tiny, base, small, medium, large
LOG_LEVEL=INFO
MAX_FILE_SIZE_MB=500
```

## API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
