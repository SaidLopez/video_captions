import { useEffect, useState } from 'react';
import { videoAPI } from '../api/client';
import { useCaptionStore } from '../store/captionStore';

export function DownloadStep() {
  const [error, setError] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const { taskId, setProgress, setTaskStatus, progress, taskStatus, reset } = useCaptionStore();

  useEffect(() => {
    if (!taskId) return;

    const pollStatus = async () => {
      try {
        const response = await videoAPI.getTaskStatus(taskId);
        setProgress(response.progress);
        setTaskStatus(response.status);

        if (response.status === 'completed' && response.result_url) {
          setDownloadUrl(response.result_url);
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
  }, [taskId, setProgress, setTaskStatus]);

  const getStatusMessage = (status) => {
    const messages = {
      pending: 'Waiting to start...',
      processing: 'Processing...',
      transcribing: 'Transcribing...',
      rendering: 'Rendering captions with your edits...',
      completed: 'Complete! Ready to download.',
      failed: 'Processing failed',
    };
    return messages[status] || 'Processing...';
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Download Your Video</h2>
        <p className="text-sm sm:text-base text-gray-600">Your video is being reprocessed with your edits...</p>
      </div>

      {error ? (
        <div className="space-y-4 sm:space-y-6">
          <div className="p-4 sm:p-6 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm sm:text-base text-red-800 font-semibold mb-4">Error: {error}</p>
            <button
              onClick={() => reset()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Start Over
            </button>
          </div>
        </div>
      ) : downloadUrl ? (
        <div className="space-y-4 sm:space-y-6">
          <div className="p-6 sm:p-8 bg-green-50 border border-green-200 rounded-lg text-center">
            <svg className="w-10 sm:w-12 h-10 sm:h-12 text-green-600 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-green-800 font-semibold text-base sm:text-lg mb-2">Your video is ready!</p>
            <p className="text-green-700 mb-4 sm:mb-6 text-sm sm:text-base">
              The video with your edited captions and styling has been created successfully.
            </p>

            <a
              href={downloadUrl}
              download
              className="inline-block px-6 sm:px-8 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm sm:text-base"
            >
              Download Video
            </a>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
            <h3 className="font-semibold text-blue-900 mb-2 sm:mb-3 text-sm sm:text-base">What you can do now:</h3>
            <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0">✓</span>
                <span>Download your video with the edited captions and custom styling</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0">✓</span>
                <span>Upload it to social media (TikTok, Instagram, YouTube, etc.)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0">✓</span>
                <span>Process another video by clicking "Start Over"</span>
              </li>
            </ul>
          </div>

          <div className="flex justify-center pt-6 border-t border-gray-200">
            <button
              onClick={() => reset()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              Process Another Video
            </button>
          </div>
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
