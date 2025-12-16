# Quick Start Guide

Get the Video Captions Editor up and running in 5 minutes.

## Prerequisites

- Python 3.10+ (`python --version`)
- Node.js 18+ (`node --version`)
- FFmpeg (`ffmpeg -version`)

## 1. Start the Backend

```bash
# Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
Uvicorn running on http://0.0.0.0:8000
```

**Test it**: Open http://localhost:8000/docs in your browser
- You'll see the Swagger UI with all available endpoints
- The green "Try it out" button lets you test endpoints

## 2. Start the Frontend

In a **new terminal**, run:

```bash
cd frontend

# Install dependencies (if not already done)
npm install

# Start the development server
npm run dev
```

You should see:
```
VITE v7.3.0 ready in XXX ms
➜  Local:   http://localhost:5173/
```

**Open it**: Click the link or visit http://localhost:5173 in your browser

## 3. Use the App

### Upload a Video
1. Drag and drop a video file or click "Select File"
2. Supported formats: MP4, MOV, AVI, MKV, WebM
3. Max file size: 500MB

### Processing
- Watch the progress bar as your video is transcribed with AI
- This takes time (5-10 minutes per hour of video on CPU)
- The status shows what step is running (extracting audio, transcribing, rendering)

### Edit Captions
- Click on any caption text to edit it
- See the word count for each segment
- Timestamps show when each caption appears

### Customize Captions
- Choose a caption style (TikTok, Instagram, YouTube Shorts, etc.)
- Adjust font size, colors, position
- See a live preview of your changes

### Reprocess & Download
- Click "Reprocess Video" to apply your edits
- Download the final video when ready
- Process another video or start over

## 4. Stop the Servers

To stop the servers:
- Backend: Press `Ctrl+C` in the backend terminal
- Frontend: Press `Ctrl+C` in the frontend terminal

## Testing with Example

### Option 1: Use Your Own Video
- Any MP4, MOV, or other supported format works
- Start small (30 seconds) for faster testing

### Option 2: Create Test Video with FFmpeg

```bash
# Create a 10-second test video with text
ffmpeg -f lavfi -i testsrc=size=640x480:duration=10 test.mp4
```

## Troubleshooting

### Frontend Can't Connect to Backend

**Problem**: `Error: Cannot connect to API`

**Solution**:
1. Make sure backend is running on port 8000
2. Check `frontend/.env` has correct API URL:
   ```
   VITE_API_BASE_URL=http://localhost:8000/api/v1
   ```
3. Check browser console (F12) for CORS errors

### Video Upload Fails

**Problem**: `Invalid file type` or `File too large`

**Solution**:
- Check file format is MP4, MOV, AVI, MKV, or WebM
- Check file size is under 500MB
- Try again with a smaller/different file

### Transcription is Very Slow

**Problem**: Takes more than 30 minutes for a short video

**Solution**:
- This is normal! Whisper AI takes time to transcribe
- Typical speed: 5-10 minutes per hour of video
- For faster transcription, set `WHISPER_MODEL=tiny` in backend `.env`
  - Smaller models are faster but less accurate

### Port Already in Use

**Problem**: `Address already in use` when starting servers

**Solution**:
```bash
# Find process using port
lsof -i :8000  # for backend
lsof -i :5173  # for frontend

# Kill the process
kill -9 <PID>

# Or use different ports
python -m uvicorn app.main:app --port 8001
npm run dev -- --port 5174
```

## Next Steps

- Read [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for architecture details
- Read [frontend/README.md](frontend/README.md) for frontend specifics
- Check out [README.md](README.md) for complete documentation

## API Documentation

While the frontend is the easiest way to use this, you can also use the API directly:

**Swagger UI**: http://localhost:8000/docs
**ReDoc**: http://localhost:8000/redoc

### Example API Call (using curl)

```bash
# 1. Upload video
curl -X POST "http://localhost:8000/api/v1/videos/caption" \
  -F "video=@test.mp4" \
  -F "style=tiktok"

# Response:
# {
#   "task_id": "abc123...",
#   "status": "pending",
#   "progress": 0.0
# }

# 2. Poll for completion
curl "http://localhost:8000/api/v1/videos/tasks/abc123..."

# 3. Get transcription
curl "http://localhost:8000/api/v1/videos/tasks/abc123.../transcription"

# 4. Reprocess with edits
curl -X POST "http://localhost:8000/api/v1/videos/reprocess" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "abc123...",
    "segments": [{"start": 0, "end": 5, "text": "Edited text"}],
    "caption_config": {"style": "instagram"}
  }'
```

## Tips

- **Smaller videos** process faster - good for testing
- **Use a modern browser** (Chrome, Firefox, Safari, Edge)
- **Check browser console** (F12) for detailed error messages
- **Watch the backend logs** for processing details
- **FFmpeg must be installed** - install it if you see `ffmpeg: not found` errors

## Performance Expectations

| Component | Expected Time |
|-----------|---|
| Video Upload | Depends on file size |
| Transcription | 5-10 min per hour of video |
| Styling Rendering | 30 seconds to 5 minutes |
| Reprocessing | 1-5 minutes |
| **Total** | **varies, typically 5-30 minutes** |

## What's Next?

Once you're comfortable with the basic workflow:
- Explore different caption styles
- Try editing longer videos
- Customize colors and fonts
- Deploy to production (see README.md for instructions)

## Support

For issues, check:
1. Browser console (F12) for frontend errors
2. Backend terminal output for processing errors
3. This QUICKSTART.md for common issues
4. IMPLEMENTATION_SUMMARY.md for architecture details
5. README.md for full documentation
