import { useEffect, useState } from 'react';
import { videoAPI } from '../api/client';
import { useCaptionStore } from '../store/captionStore';

export function ProcessingStep() {
  const [error, setError] = useState(null);
  const { taskId, setProgress, setTaskStatus, setCurrentStep, setTranscription, progress, taskStatus } =
    useCaptionStore();

  useEffect(() => {
    if (!taskId) return;

    const pollStatus = async () => {
      try {
        const response = await videoAPI.getTaskStatus(taskId);
        setProgress(response.progress);
        setTaskStatus(response.status);

        if (response.status === 'completed') {
          // Fetch transcription
          const transcriptionData = await videoAPI.getTranscription(taskId);
          setTranscription(transcriptionData);
          setCurrentStep('edit');
        } else if (response.status === 'failed') {
          setError(response.error || 'Processing failed');
        }
      } catch (err) {
        console.error('Error polling status:', err);
        setError(err.message);
      }
    };

    // Poll every 2 seconds
    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [taskId, setProgress, setTaskStatus, setCurrentStep, setTranscription]);

  const getStatusMessage = (status) => {
    const messages = {
      pending: 'Waiting to start...',
      processing: 'Extracting audio...',
      transcribing: 'Transcribing audio with AI...',
      rendering: 'Rendering captions...',
      completed: 'Processing complete!',
      failed: 'Processing failed',
    };
    return messages[status] || 'Processing...';
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Processing Video</h2>
        <p className="text-sm sm:text-base text-gray-600">Please wait while your video is being processed...</p>
      </div>

      {error ? (
        <div className="p-4 sm:p-6 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm sm:text-base text-red-800 font-semibold mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <span className="text-gray-600 font-medium text-sm sm:text-base">Progress</span>
              <span className="text-xl sm:text-2xl font-bold text-blue-600">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Status Message */}
          <div className="p-4 sm:p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="animate-spin flex-shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-blue-900 text-sm sm:text-base">{getStatusMessage(taskStatus)}</p>
                <p className="text-xs sm:text-sm text-blue-700 mt-1 break-all">Task ID: {taskId}</p>
              </div>
            </div>
          </div>

          {/* Processing Steps */}
          <div className="space-y-2 sm:space-y-3">
            {[
              { name: 'Extracting audio', threshold: 5 },
              { name: 'Transcribing audio', threshold: 20 },
              { name: 'Rendering captions', threshold: 70 },
              { name: 'Finalizing', threshold: 100 },
            ].map((step, idx) => (
              <div key={idx} className="flex items-center gap-2 sm:gap-3">
                {progress >= step.threshold ? (
                  <svg className="w-5 h-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex-shrink-0" />
                )}
                <span className={`text-sm ${progress >= step.threshold ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                  {step.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
