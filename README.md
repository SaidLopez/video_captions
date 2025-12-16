# Video Captions - Full Stack Application

Complete solution for adding TikTok/social media style captions to videos with AI transcription, editing, and customization.

## Features

- 🎬 **Video Processing** - Enterprise-grade FastAPI service
- 📝 **AI Transcription** - Automatic speech-to-text using OpenAI Whisper
- ✏️ **Edit Transcriptions** - Web interface to edit AI-generated captions
- 🎨 **Caption Styling** - Multiple styles with customizable fonts, colors, positioning
- ✨ **Word-by-word Highlighting** - Animation for word-by-word highlighting during playback
- 🔄 **Smart Reprocessing** - Re-render videos with edited transcriptions
- 📱 **Modern Web UI** - React-based frontend with Tailwind CSS
- 🔌 **RESTful API** - OpenAPI documentation with Swagger UI

## Project Structure

```
video_captions/
├── app/                        # Backend application
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   ├── health.py  # Health check endpoints
│   │       │   └── videos.py  # Video processing & reprocessing endpoints
│   │       └── router.py
│   ├── core/
│   │   ├── config.py
│   │   ├── exceptions.py
│   │   └── logging.py
│   ├── middleware/
│   │   ├── error_handler.py
│   │   └── logging.py
│   ├── models/
│   │   └── __init__.py         # VideoTask, Transcription models
│   ├── schemas/
│   │   └── __init__.py         # Pydantic schemas & EditTranscriptionRequest
│   ├── services/
│   │   ├── orchestrator.py     # Main processing orchestrator + reprocess_with_edited_transcription()
│   │   ├── storage.py
│   │   ├── task_manager.py
│   │   ├── transcription.py
│   │   └── video_processor.py
│   └── main.py
├── frontend/                    # React web interface
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadStep.jsx
│   │   │   ├── ProcessingStep.jsx
│   │   │   ├── EditStep.jsx
│   │   │   ├── StylingStep.jsx
│   │   │   ├── ReprocessingStep.jsx
│   │   │   └── DownloadStep.jsx
│   │   ├── api/
│   │   │   └── client.js       # API communication
│   │   ├── store/
│   │   │   └── captionStore.js # Zustand state
│   │   └── App.jsx
│   └── README.md
├── requirements.txt
├── README.md
└── .env
```

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- FFmpeg (required for video processing)

### Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Complete Workflow

1. **Upload Video** - Open the frontend at `http://localhost:5173`
2. **Process & Transcribe** - Wait for AI to transcribe the video
3. **Edit Transcription** - Review and edit the AI-generated captions
4. **Customize Styling** - Choose caption style, colors, position
5. **Reprocess** - Re-render video with your edited captions
6. **Download** - Download the final video with custom captions

## API Endpoints

### Video Processing
- `POST /api/v1/videos/caption` - Upload video and add captions
- `GET /api/v1/videos/tasks/{task_id}` - Check processing status
- `GET /api/v1/videos/download/{filename}` - Download processed video
- `GET /api/v1/videos/styles` - List available caption styles

### Transcription Editing
- `GET /api/v1/videos/tasks/{task_id}/transcription` - Get transcription for editing
- `POST /api/v1/videos/reprocess` - Reprocess with edited transcription and styling

### Health Check
- `GET /api/v1/health` - API health check
- `GET /api/v1/ready` - Readiness probe

### Example cURL Request (API only, no UI)

```bash
curl -X POST "http://localhost:8000/api/v1/videos/caption" \
  -F "video=@my_video.mp4" \
  -F "style=tiktok" \
  -F "position=bottom" \
  -F "highlight_current_word=true"
```

### Example Reprocess Request

```bash
curl -X POST "http://localhost:8000/api/v1/videos/reprocess" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "uuid-of-original-task",
    "segments": [
      {
        "start": 0.0,
        "end": 5.5,
        "text": "Your edited caption text",
        "words": []
      }
    ],
    "caption_config": {
      "style": "instagram",
      "position": "bottom",
      "font_size": 48
    }
  }'
```

## Caption Styles

- `tiktok` - Bold white text with green highlight
- `instagram` - Clean white text with black background box
- `youtube_shorts` - Impact font with gold highlight
- `minimal` - Subtle white text with thin outline
- `bold` - Large yellow text with red highlight
- `neon` - Cyan text with magenta stroke

## Configuration

Set environment variables or create a `.env` file:

```env
WHISPER_MODEL=base         # tiny, base, small, medium, large
LOG_LEVEL=INFO
MAX_FILE_SIZE_MB=500
DEBUG=False
```

## API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Frontend**: http://localhost:5173

## Frontend Documentation

See [frontend/README.md](frontend/README.md) for detailed frontend documentation including:
- Component structure
- State management
- Development tips
- Production deployment
