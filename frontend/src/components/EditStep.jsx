import { useRef, useState, useEffect } from 'react';
import { useCaptionStore } from '../store/captionStore';
import { videoAPI } from '../api/client';

const START_STYLES = {
  tiktok: {
    fontFamily: 'Arial',
    fontSize: '24px',
    color: '#FFF',
    textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
    fontWeight: 'bold',
  },
  // Add other basic mappings or rely on captionConfig application
};

export function EditStep() {
  const {
    editedSegments,
    updateSegment,
    setCurrentStep,
    taskId,
    captionConfig,
    updateCaptionConfig
  } = useCaptionStore();

  const videoRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeSegment, setActiveSegment] = useState(null);
  const [availableStyles, setAvailableStyles] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
  const videoSrc = `${API_BASE_URL}/videos/stream/${taskId}`;

  useEffect(() => {
    // Load styles
    const loadStyles = async () => {
      try {
        const stylesData = await videoAPI.getStyles();
        setAvailableStyles(stylesData.styles);
      } catch (err) {
        console.error('Failed to load styles', err);
      }
    };
    loadStyles();
  }, []);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);

      // Find active segment
      const segment = editedSegments.find(
        seg => time >= seg.start && time <= seg.end
      );
      setActiveSegment(segment);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSegmentClick = (start) => {
    if (videoRef.current) {
      videoRef.current.currentTime = start;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const getPreviewStyle = () => {
    // Map captionConfig to CSS
    const style = {
      color: captionConfig.font_color,
      fontSize: `${Math.max(16, captionConfig.font_size / 2)}px`, // Scale down a bit for preview if needed, or keep accurate
      fontWeight: captionConfig.font_weight || 'bold', // Default to bold if not set
      fontFamily: 'Arial, sans-serif', // Default
      textAlign: 'center',
      textShadow: captionConfig.stroke_width > 0
        ? `-${captionConfig.stroke_width}px -${captionConfig.stroke_width}px 0 ${captionConfig.stroke_color}, 
           ${captionConfig.stroke_width}px -${captionConfig.stroke_width}px 0 ${captionConfig.stroke_color}, 
           -${captionConfig.stroke_width}px ${captionConfig.stroke_width}px 0 ${captionConfig.stroke_color}, 
           ${captionConfig.stroke_width}px ${captionConfig.stroke_width}px 0 ${captionConfig.stroke_color}`
        : 'none',
      backgroundColor: captionConfig.background_color ? captionConfig.background_color : 'transparent',
    };

    if (captionConfig.style === 'youtube_shorts') {
      style.fontFamily = 'Impact, sans-serif';
      style.textTransform = 'uppercase';
    } else if (captionConfig.style === 'instagram') {
      style.backgroundColor = 'rgba(0,0,0,0.5)';
      style.borderRadius = '4px';
      style.padding = '4px 8px';
    }

    return style;
  };

  const renderCaptionContent = (segment) => {
    if (!segment) return null;

    const maxWords = captionConfig.max_words_per_line || 5;
    const words = segment.text.split(/(\s+)/);
    // Filter out whitespace-only chunks for counting/paging purposes, but keep them for rendering
    // Actually, splitting by space and mapping is tricky if we want to preserve exact whitespace.
    // Let's use a simpler approach: Split by whitespace to get "words" for logic, 
    // but we need to reconstruct the original string or usable chunks.

    // Better approach:
    // 1. Identify real words and their indices in the original text or split array.
    // 2. Determine active word index (precise or interpolated).
    // 3. Determine which "page" this active word is in.
    // 4. Render only the words (and surrounding whitespace) for that page.

    const realWords = segment.text.trim().split(/\s+/);
    const totalRealWords = realWords.length;

    if (totalRealWords === 0) return segment.text;

    // --- Determine Active Word Index ---
    let activeWordIndex = 0;

    // Try precise timing
    let usePrecise = false;
    let hasPreciseData = segment.words && segment.words.length > 0;

    if (hasPreciseData) {
      const wordsText = segment.words.map(w => w.word || w.text).join('').replace(/\s/g, '').toLowerCase();
      const currentText = segment.text.replace(/\s/g, '').toLowerCase();
      // Check if text roughly matches (tolerant of minor edits/whitespace)
      if (Math.abs(wordsText.length - currentText.length) < 5 || wordsText === currentText) {
        usePrecise = true;
      }
    }

    if (usePrecise) {
      // Find the word active at currentTime
      const matchIndex = segment.words.findIndex(w => currentTime >= w.start && currentTime <= w.end);
      if (matchIndex !== -1) {
        activeWordIndex = matchIndex;
      } else if (currentTime > segment.words[segment.words.length - 1].end) {
        activeWordIndex = totalRealWords - 1; // End
      } else {
        // Find closest or just look for the one we just passed
        // If we are between words, we might be "waiting" for next, 
        // but visually we usually show the upcoming batch or hold previous?
        // Let's hold previous or show next based on proximity? 
        // Simpler: find the next word starting after current time 
        // and assume we are at index - 1 (or 0).
        let found = -1;
        for (let i = 0; i < segment.words.length; i++) {
          if (currentTime < segment.words[i].start) {
            found = i;
            break;
          }
        }
        activeWordIndex = found === -1 ? totalRealWords - 1 : Math.max(0, found - 1);
      }
    } else {
      // Linear Interpolation
      const duration = segment.end - segment.start;
      const relativeTime = Math.max(0, currentTime - segment.start);
      const progress = Math.min(1, relativeTime / duration);
      activeWordIndex = Math.floor(progress * totalRealWords);
      activeWordIndex = Math.min(activeWordIndex, totalRealWords - 1);
    }

    // --- Determine Page ---
    // Page index based on active word
    const pageIndex = Math.floor(activeWordIndex / maxWords);
    const startIndex = pageIndex * maxWords;
    const endIndex = Math.min(startIndex + maxWords, totalRealWords);

    // --- Render Page ---
    // We need to slice the "realWords" but also preserve spaces if possible.
    // For simplicity in this preview, joining with space is usually acceptable 
    // unless the user has specific formatting.
    // Given the user complaints about "big chunks", standard spacing is likely fine.

    const pageWords = realWords.slice(startIndex, endIndex);

    return (
      <span className="flex flex-wrap justify-center gap-[0.25em]">
        {pageWords.map((word, i) => {
          const relativeIndex = startIndex + i;
          const isActive = captionConfig.highlight_current_word && relativeIndex === activeWordIndex;

          return (
            <span
              key={i}
              style={{
                color: isActive ? captionConfig.highlight_color : 'inherit',
                // Add partial background if style demands it (e.g. tiktok/instagram default)
                // But color is the main requested feature.
              }}
            >
              {word}
            </span>
          );
        })}
      </span>
    );
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Editor</h2>
        <button
          onClick={() => setCurrentStep('render')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm flex items-center gap-2"
        >
          <span>Render Video</span>
          <span>→</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">

        {/* Left: Text Editor */}
        <div className="w-full lg:w-1/3 flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm h-full overflow-hidden">
          <div className="p-3 border-b border-gray-200 bg-gray-50 font-medium text-gray-700">
            Transcript
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {editedSegments.map((segment, index) => (
              <div
                key={index}
                className={`flex gap-2 p-3 rounded-lg border cursor-pointer transition-all ${currentTime >= segment.start && currentTime <= segment.end
                  ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                onClick={() => handleSegmentClick(segment.start)}
              >
                <div className="text-xs font-mono text-gray-500 mt-1 min-w-[3rem]">
                  {formatTime(segment.start)}
                </div>
                <textarea
                  value={segment.text}
                  onChange={(e) => updateSegment(index, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 bg-transparent border-none focus:ring-0 p-0 resize-none text-sm font-medium text-gray-900"
                  rows={Math.max(2, Math.ceil(segment.text.length / 30))}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Middle: Video Preview */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4">
          <div className="relative bg-black rounded-xl overflow-hidden shadow-lg aspect-[9/16] max-h-full mx-auto">
            <video
              ref={videoRef}
              src={videoSrc}
              onTimeUpdate={handleTimeUpdate}
              onClick={handlePlayPause}
              className="w-full h-full object-contain bg-black cursor-pointer"
            >
              Your browser does not support the video tag.
            </video>

            {/* Play Button Overlay */}
            {!isPlaying && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
                onClick={handlePlayPause}
              >
                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center pl-1 shadow-lg backdrop-blur-sm">
                  <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            )}

            <div className="absolute inset-0 pointer-events-none flex flex-col items-center"
              style={{
                justifyContent: captionConfig.position === 'top' ? 'flex-start' :
                  captionConfig.position === 'center' ? 'center' : 'flex-end',
                paddingBottom: '20%', // Approximate bottom margin
                paddingTop: '20%'
              }}>
              {activeSegment && (
                <div
                  className="px-4 text-center transition-all duration-200 max-w-[90%]"
                  style={getPreviewStyle()}
                >
                  {renderCaptionContent(activeSegment)}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => {
                const v = videoRef.current;
                if (v) v.currentTime = Math.max(0, v.currentTime - 5);
              }}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              ⏮️ -5s
            </button>
            <button
              onClick={handlePlayPause}
              className="p-2 rounded-full hover:bg-gray-100 font-bold w-24 text-center"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={() => {
                const v = videoRef.current;
                if (v) v.currentTime = Math.min(v.duration, v.currentTime + 5);
              }}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              +5s ⏭️
            </button>
          </div>
        </div>

        {/* Right: Styling Controls */}
        <div className="w-full lg:w-1/3 bg-white rounded-lg border border-gray-200 shadow-sm overflow-y-auto max-h-full">
          <div className="p-3 border-b border-gray-200 bg-gray-50 font-medium text-gray-700 sticky top-0">
            Style Settings
          </div>
          <div className="p-4 space-y-6">

            {/* Presets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preset Style</label>
              <div className="grid grid-cols-2 gap-2">
                {availableStyles.map((style) => (
                  <button
                    key={style.name}
                    onClick={() => {
                      const newConfig = { style: style.name };
                      if (style.config) {
                        if (style.config.font_size) newConfig.font_size = style.config.font_size;
                        if (style.config.font_color) newConfig.font_color = style.config.font_color;
                        if (style.config.stroke_color) newConfig.stroke_color = style.config.stroke_color;
                        if (style.config.stroke_width !== undefined) newConfig.stroke_width = style.config.stroke_width;
                        if (style.config.highlight_color) newConfig.highlight_color = style.config.highlight_color;
                      }
                      updateCaptionConfig(newConfig);
                    }}
                    className={`p-2 text-sm rounded border text-left flex flex-col ${captionConfig.style === style.name ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <span className="font-semibold capitalize">{style.name.replace('_', ' ')}</span>
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Configs */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Words Per Line: {captionConfig.max_words_per_line}
                </label>
                <input
                  type="range" min="1" max="10"
                  value={captionConfig.max_words_per_line}
                  onChange={(e) => updateCaptionConfig({ max_words_per_line: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Font Size</label>
                <input
                  type="range" min="12" max="100"
                  value={captionConfig.font_size}
                  onChange={(e) => updateCaptionConfig({ font_size: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Text Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={captionConfig.font_color}
                      onChange={(e) => updateCaptionConfig({ font_color: e.target.value })}
                      className="h-8 w-8 rounded cursor-pointer border border-gray-300"
                    />
                    <input
                      type="text" value={captionConfig.font_color}
                      onChange={(e) => updateCaptionConfig({ font_color: e.target.value })}
                      className="flex-1 text-xs border border-gray-300 rounded px-2"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Outline</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={captionConfig.stroke_color}
                      onChange={(e) => updateCaptionConfig({ stroke_color: e.target.value })}
                      className="h-8 w-8 rounded cursor-pointer border border-gray-300"
                    />
                    <input
                      type="number" min="0" max="10"
                      value={captionConfig.stroke_width}
                      onChange={(e) => updateCaptionConfig({ stroke_width: parseInt(e.target.value) })}
                      className="w-12 text-xs border border-gray-300 rounded px-1"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Position</label>
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                  {['top', 'center', 'bottom'].map(pos => (
                    <button
                      key={pos}
                      onClick={() => updateCaptionConfig({ position: pos })}
                      className={`flex-1 py-1 text-xs rounded capitalize transition-all ${captionConfig.position === pos ? 'bg-white shadow text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
