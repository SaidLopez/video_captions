import { useRef } from 'react';
import { useCaptionStore } from '../store/captionStore';

export function EditStep() {
  const { editedSegments, updateSegment, setCurrentStep, taskId } = useCaptionStore();
  const videoRef = useRef(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
  const videoSrc = `${API_BASE_URL}/videos/stream/${taskId}`;

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSegmentClick = (start) => {
    if (videoRef.current) {
      videoRef.current.currentTime = start;
      videoRef.current.play();
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Edit Transcription</h2>
        <p className="text-sm sm:text-base text-gray-600">Review and edit the transcription text. Click on a segment to verify with the video.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-16rem)] min-h-[500px]">
        {/* Left Column: Captions List */}
        <div className="w-full lg:w-1/2 flex flex-col h-full">
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {editedSegments.map((segment, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start p-3 sm:p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                onClick={() => handleSegmentClick(segment.start)}
              >
                <div className="flex-shrink-0 min-w-16 sm:min-w-20 pt-2 cursor-pointer">
                  <div className="text-xs sm:text-sm font-mono text-gray-500 group-hover:text-blue-600 font-medium">
                    <div>{formatTime(segment.start)}</div>
                  </div>
                </div>

                <div className="flex-grow w-full sm:w-auto">
                  <textarea
                    value={segment.text}
                    onChange={(e) => updateSegment(index, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    rows="2"
                  />
                </div>

                <div className="flex-shrink-0 pt-2">
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                    {segment.text.split(/\s+/).filter(Boolean).length} w
                  </div>
                </div>
              </div>
            ))}

            {editedSegments.length === 0 && (
              <div className="p-8 text-center bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-gray-500">No segments to display</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Video Player */}
        <div className="w-full lg:w-1/2 flex flex-col gap-4">
          <div className="bg-black rounded-xl overflow-hidden shadow-lg sticky top-0 border border-gray-800">
            <video
              ref={videoRef}
              src={videoSrc}
              controls
              className="w-full aspect-video bg-black"
            >
              Your browser does not support the video tag.
            </video>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-800 flex items-center gap-2">
            <span>💡</span>
            <p><strong>Pro Tip:</strong> Click on the timestamp or the card background of any segment to verify the audio match.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between pt-6 border-t border-gray-200 mt-6">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          Start Over
        </button>
        <button
          onClick={() => setCurrentStep('styling')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
        >
          Next: Caption Styling →
        </button>
      </div>
    </div>
  );
}
