import { useState, useEffect } from 'react';
import { videoAPI } from '../api/client';
import { useCaptionStore } from '../store/captionStore';

const STYLE_DESCRIPTIONS = {
  tiktok: 'Bold white text with green highlight - TikTok style',
  instagram: 'White text with black background - Instagram style',
  youtube_shorts: 'Large impact font with gold highlight - YouTube Shorts style',
  minimal: 'Subtle white text with thin outline - Minimal style',
  bold: 'Large yellow text with red highlight - Bold style',
  neon: 'Cyan text with magenta stroke - Neon style',
};

export function StylingStep() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { captionConfig, updateCaptionConfig, setCurrentStep, taskId } = useCaptionStore();
  const [availableStyles, setAvailableStyles] = useState([]);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [stylesData] = await Promise.all([
          videoAPI.getStyles(),
        ]);
        setAvailableStyles(stylesData.styles);

        if (taskId) {
          const url = videoAPI.getThumbnail(taskId);
          setThumbnailUrl(url);
        }
      } catch (err) {
        setError('Failed to load styles');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto text-center py-12">
        <div className="animate-spin inline-block">
          <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Caption Styling</h2>
        <p className="text-sm sm:text-base text-gray-600">Customize how your captions look in the final video.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Settings */}
        <div className="space-y-5 sm:space-y-6">
          {/* Style Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Caption Style</label>
            <div className="grid grid-cols-2 gap-2">
              {availableStyles.map((style) => (
                <button
                  key={style.name}
                  onClick={() => {
                    const newConfig = { style: style.name };
                    // If the style object has a config (it should now), apply it
                    if (style.config) {
                      // Map backend config keys to frontend store keys if they differ
                      // Based on schema, they match mostly.
                      if (style.config.font_size) newConfig.font_size = style.config.font_size;
                      if (style.config.font_color) newConfig.font_color = style.config.font_color;
                      if (style.config.stroke_color) newConfig.stroke_color = style.config.stroke_color;
                      if (style.config.stroke_width !== undefined) newConfig.stroke_width = style.config.stroke_width;
                      if (style.config.highlight_color) newConfig.highlight_color = style.config.highlight_color;
                      // Ensure we don't accidentally overwrite user manual tweaks unless they explicitly switch styles
                      // But the request is to fix the preview not updating, so applying defaults is expected.
                    }
                    updateCaptionConfig(newConfig);
                  }}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${captionConfig.style === style.name
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="font-medium text-sm capitalize">{style.name.replace('_', ' ')}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {STYLE_DESCRIPTIONS[style.name] || style.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Position */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Position</label>
            <div className="grid grid-cols-3 gap-2">
              {['top', 'center', 'bottom'].map((pos) => (
                <button
                  key={pos}
                  onClick={() => updateCaptionConfig({ position: pos })}
                  className={`p-2 rounded-lg border-2 transition-all capitalize ${captionConfig.position === pos
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Font Size: {captionConfig.font_size}px
            </label>
            <input
              type="range"
              min="12"
              max="120"
              value={captionConfig.font_size}
              onChange={(e) => updateCaptionConfig({ font_size: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Font Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Font Color</label>
            <div className="flex items-center gap-2 sm:gap-3">
              <input
                type="color"
                value={captionConfig.font_color}
                onChange={(e) => updateCaptionConfig({ font_color: e.target.value })}
                className="w-10 h-10 sm:w-12 sm:h-10 rounded cursor-pointer flex-shrink-0"
              />
              <input
                type="text"
                value={captionConfig.font_color}
                onChange={(e) => updateCaptionConfig({ font_color: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs sm:text-sm"
                placeholder="#000000"
              />
            </div>
          </div>

          {/* Stroke Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Outline/Stroke Color</label>
            <div className="flex items-center gap-2 sm:gap-3">
              <input
                type="color"
                value={captionConfig.stroke_color}
                onChange={(e) => updateCaptionConfig({ stroke_color: e.target.value })}
                className="w-10 h-10 sm:w-12 sm:h-10 rounded cursor-pointer flex-shrink-0"
              />
              <input
                type="text"
                value={captionConfig.stroke_color}
                onChange={(e) => updateCaptionConfig({ stroke_color: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs sm:text-sm"
                placeholder="#000000"
              />
            </div>
          </div>

          {/* Stroke Width */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Outline/Stroke Width: {captionConfig.stroke_width}px
            </label>
            <input
              type="range"
              min="0"
              max="10"
              value={captionConfig.stroke_width}
              onChange={(e) => updateCaptionConfig({ stroke_width: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Highlight Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Highlight Color</label>
            <div className="flex items-center gap-2 sm:gap-3">
              <input
                type="color"
                value={captionConfig.highlight_color}
                onChange={(e) => updateCaptionConfig({ highlight_color: e.target.value })}
                className="w-10 h-10 sm:w-12 sm:h-10 rounded cursor-pointer flex-shrink-0"
              />
              <input
                type="text"
                value={captionConfig.highlight_color}
                onChange={(e) => updateCaptionConfig({ highlight_color: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs sm:text-sm"
                placeholder="#000000"
              />
            </div>
          </div>

          {/* Max Words Per Line */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Max Words Per Line: {captionConfig.max_words_per_line}
            </label>
            <input
              type="range"
              min="1"
              max="15"
              value={captionConfig.max_words_per_line}
              onChange={(e) => updateCaptionConfig({ max_words_per_line: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Highlight Current Word */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="highlight_word"
              checked={captionConfig.highlight_current_word}
              onChange={(e) => updateCaptionConfig({ highlight_current_word: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
            <label htmlFor="highlight_word" className="ml-3 text-sm text-gray-700 cursor-pointer">
              Highlight current word during playback
            </label>
          </div>
        </div>

        {/* Preview */}
        <div
          className="flex flex-col items-center justify-center p-6 sm:p-8 bg-gray-900 rounded-lg min-h-80 sm:min-h-96 relative overflow-hidden"
          style={{
            backgroundImage: thumbnailUrl ? `url(${thumbnailUrl})` : 'none',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Overlay to ensure text readability if needed, though usually captions sit on video directly */}
          {/* <div className="absolute inset-0 bg-black/30 pointer-events-none"></div> */}

          <div className="text-center mb-6 sm:mb-8 w-full px-4 relative z-10">
            <p className="text-gray-400 text-xs sm:text-sm mb-4">Preview</p>
            <div
              className="inline-block px-4 sm:px-6 py-2 sm:py-3 rounded max-w-full break-words"
              style={{
                color: captionConfig.font_color,
                textShadow: `
                  ${captionConfig.stroke_width > 0 ? `-1px -1px 0 ${captionConfig.stroke_color}` : ''},
                  ${captionConfig.stroke_width > 0 ? `1px -1px 0 ${captionConfig.stroke_color}` : ''},
                  ${captionConfig.stroke_width > 0 ? `-1px 1px 0 ${captionConfig.stroke_color}` : ''},
                  ${captionConfig.stroke_width > 0 ? `1px 1px 0 ${captionConfig.stroke_color}` : ''}
                `.trim(),
                fontSize: `${Math.min(captionConfig.font_size, 48)}px`,
                fontWeight: 'bold',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              Sample Caption Text
            </div>
          </div>

          <div className="text-gray-500 text-xs sm:text-sm space-y-2 mt-6 sm:mt-8">
            <p>Style: <span className="text-gray-300 capitalize">{captionConfig.style.replace('_', ' ')}</span></p>
            <p>Position: <span className="text-gray-300 capitalize">{captionConfig.position}</span></p>
            <p>Font Size: <span className="text-gray-300">{captionConfig.font_size}px</span></p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between pt-6 border-t border-gray-200 mt-6 sm:mt-8">
        <button
          onClick={() => setCurrentStep('edit')}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          ← Back: Edit Transcription
        </button>
        <button
          onClick={() => setCurrentStep('reprocessing')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          Next: Reprocess Video →
        </button>
      </div>
    </div>
  );
}
