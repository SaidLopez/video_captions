# Video Captions Editor - Frontend

A modern React frontend for editing video transcriptions and customizing captions before final rendering.

## Features

- 📤 **Video Upload** - Drag-and-drop or click to upload video files
- ✏️ **Transcription Editing** - Edit the AI-generated transcription text
- 🎨 **Caption Styling** - Customize colors, size, position, and effects
- 👁️ **Live Preview** - See a preview of your caption styling
- 🔄 **Smart Reprocessing** - Re-render video with edited captions
- ⬇️ **Download** - Download the final video with custom captions
- 📊 **Progress Tracking** - Real-time progress updates during processing

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Axios** - HTTP client

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file (or copy from `.env.example`):

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Update the URL if your backend is running on a different host/port.

### 3. Development Server

```bash
npm run dev
```

The app will start on `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

Output files will be in the `dist/` directory.

## Project Structure

```
frontend/
├── src/
│   ├── components/           # Step components
│   │   ├── UploadStep.jsx    # Video upload
│   │   ├── ProcessingStep.jsx # Progress tracking
│   │   ├── EditStep.jsx      # Transcription editor
│   │   ├── StylingStep.jsx   # Caption styling
│   │   ├── ReprocessingStep.jsx # Reprocessing submission
│   │   └── DownloadStep.jsx  # Final download
│   ├── api/
│   │   └── client.js         # API communication
│   ├── store/
│   │   └── captionStore.js   # Zustand state management
│   ├── App.jsx               # Main app component
│   ├── App.css               # Global styles
│   └── index.css             # Base styles
├── .env                      # Environment configuration
├── tailwind.config.js        # Tailwind configuration
├── postcss.config.js         # PostCSS configuration
└── vite.config.js            # Vite configuration
```

## User Workflow

### Step 1: Upload
- Upload a video file (MP4, MOV, AVI, MKV, WebM)
- Maximum file size: 500MB
- Validates file format on the backend

### Step 2: Processing
- Backend extracts audio and transcribes it using Whisper AI
- Real-time progress updates every 2 seconds
- Shows current status (extracting audio, transcribing, etc.)

### Step 3: Edit Transcription
- Review and edit the AI-generated transcription
- Each segment shows start/end timestamps
- Word count for each segment
- Edit transcription by clicking on text fields

### Step 4: Customize Captions
- Choose from 6 pre-defined styles (TikTok, Instagram, YouTube Shorts, etc.)
- Adjust caption position (top, center, bottom)
- Customize font size (12-120px)
- Set font color and stroke/outline color
- Enable word-by-word highlighting
- Control max words per line
- Live preview of caption styling

### Step 5: Reprocess
- Submit edited transcription with new styling
- Creates a new processing task
- Skips transcription step (uses edited text)
- Shows summary of all changes before submission

### Step 6: Download
- Monitor reprocessing progress
- Download final video when complete
- Option to process another video

## API Endpoints Used

The frontend communicates with these backend endpoints:

- `POST /videos/caption` - Upload and caption video
- `GET /videos/tasks/{task_id}` - Check task status
- `GET /videos/tasks/{task_id}/transcription` - Get transcription for editing
- `POST /videos/reprocess` - Reprocess with edited transcription
- `GET /videos/download/{filename}` - Download processed video
- `GET /videos/styles` - Get available caption styles

## State Management

Uses Zustand for centralized state:

```javascript
{
  currentStep,        // Current workflow step
  taskId,             // Current task ID
  videoFile,          // Uploaded video file
  transcription,      // Original transcription
  editedSegments,     // User-edited segments
  captionConfig,      // Caption styling options
  progress,           // Processing progress %
  taskStatus,         // Current task status
  availableStyles,    // Available caption styles
}
```

## Styling System

Caption styles can be customized with:

- **Style** - Predefined style presets
- **Position** - top, center, bottom
- **Font Size** - 12-120 pixels
- **Font Color** - Any hex color
- **Stroke/Outline** - Color and width
- **Highlight Color** - Color for word highlighting
- **Max Words Per Line** - 1-15 words
- **Highlight Current Word** - Toggle word-by-word highlighting during playback

## Development Tips

### Enable CORS on Backend

The frontend makes requests to the backend API. Make sure CORS is properly configured:

```python
# In your FastAPI app
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Debugging

1. Open browser DevTools (F12)
2. Check Network tab to see API requests
3. Check Console tab for JavaScript errors
4. Check React DevTools for component state

### Testing

To test locally:

1. Start the backend: `python -m uvicorn app.main:app --reload`
2. Start the frontend: `npm run dev`
3. Open `http://localhost:5173`
4. Upload a test video and follow the workflow

## Production Deployment

### Static File Serving

For production, serve the built frontend as static files from FastAPI:

```python
from fastapi.staticfiles import StaticFiles

app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="static")
```

### Docker Deployment

```dockerfile
# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY frontend .
RUN npm install && npm run build

# Runtime stage
FROM python:3.11
WORKDIR /app
COPY . .
COPY --from=build /app/dist frontend/dist

# FastAPI serves the static files
RUN pip install -r requirements.txt
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0"]
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android)

## Performance

- **Bundle Size**: ~260KB (82KB gzipped) for JavaScript
- **CSS**: ~4.66KB (~1.38KB gzipped) with Tailwind CSS
- **Initial Load Time**: <2 seconds on 4G connection

## Troubleshooting

### API Connection Issues

If you see "Cannot connect to API" errors:

1. Check backend is running: `http://localhost:8000/api/v1/health`
2. Verify `VITE_API_BASE_URL` in `.env`
3. Check browser console for CORS errors
4. Ensure backend has CORS middleware configured

### Video Upload Fails

- Check file format (mp4, mov, avi, mkv, webm)
- Check file size is under 500MB
- Check backend logs for detailed error

### Transcription Takes Too Long

- This depends on video length and Whisper model size
- Typical speeds: 5-10 minutes per hour of video on CPU
- Enable GPU acceleration on backend for faster processing

## Support

For issues or feature requests, please check the main project README.
