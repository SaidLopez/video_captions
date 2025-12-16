import { useState } from 'react';
import { videoAPI } from '../api/client';
import { useCaptionStore } from '../store/captionStore';

export function ReprocessingStep() {
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTaskId, setNewTaskId] = useState(null);

  const {
    taskId,
    setTaskId,
    editedSegments,
    captionConfig,
    setProgress,
    setTaskStatus,
    setCurrentStep,
  } = useCaptionStore();

  const submitReprocess = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Create segment objects for submission
      const segments = editedSegments.map((seg) => ({
        start: seg.start,
        end: seg.end,
        text: seg.text,
        words: seg.words || [],
      }));

      const response = await videoAPI.reprocessVideo(taskId, segments, captionConfig);

      setNewTaskId(response.task_id);
      setTaskId(response.task_id);
      setProgress(response.progress);
      setTaskStatus(response.status);
      setCurrentStep('download');
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Render Video</h2>
        <p className="text-sm sm:text-base text-gray-600">
          Your edited transcription and styling will now be applied to create the final video.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {!newTaskId ? (
        <div className="space-y-4 sm:space-y-6">
          {/* Summary of Changes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
            <h3 className="font-semibold text-blue-900 mb-3 sm:mb-4 text-sm sm:text-base">Summary of Changes</h3>
            <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-blue-800">
              <div className="flex justify-between gap-4">
                <span>Caption Style:</span>
                <span className="font-mono font-medium capitalize">{captionConfig.style.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Position:</span>
                <span className="font-mono font-medium capitalize">{captionConfig.position}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Font Size:</span>
                <span className="font-mono font-medium">{captionConfig.font_size}px</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Font Color:</span>
                <span className="font-mono font-medium">{captionConfig.font_color}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Stroke Width:</span>
                <span className="font-mono font-medium">{captionConfig.stroke_width}px</span>
              </div>
              <div className="border-t border-blue-300 pt-2 sm:pt-3 mt-2 sm:mt-3 flex justify-between gap-4">
                <span>Transcription Segments:</span>
                <span className="font-mono font-medium">{editedSegments.length} segments edited</span>
              </div>
            </div>
          </div>

          {/* Edited Segments Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-6">
            <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Edited Transcription Preview</h3>
            <div className="max-h-48 sm:max-h-64 overflow-y-auto space-y-1 sm:space-y-2">
              {editedSegments.slice(0, 5).map((segment, idx) => (
                <div key={idx} className="text-xs sm:text-sm break-words">
                  <span className="text-gray-500">[{idx + 1}]</span>
                  <span className="text-gray-700 ml-2">{segment.text}</span>
                </div>
              ))}
              {editedSegments.length > 5 && (
                <div className="text-xs sm:text-sm text-gray-500 italic">
                  ... and {editedSegments.length - 5} more segments
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between pt-6 border-t border-gray-200">
            <button
              onClick={() => setCurrentStep('edit')}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              ← Back: Edit
            </button>
            <button
              onClick={submitReprocess}
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
            >
              {isSubmitting ? 'Starting Render...' : 'Render Video'}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 sm:py-8">
          <div className="inline-block p-3 bg-green-50 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <p className="text-green-800 font-semibold mb-2 text-sm sm:text-base">Rendering started!</p>
          <p className="text-gray-600 mb-4 text-xs sm:text-sm break-all">New Task ID: {newTaskId}</p>
          <button
            onClick={() => setCurrentStep('download')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            View Progress →
          </button>
        </div>
      )}
    </div>
  );
}
