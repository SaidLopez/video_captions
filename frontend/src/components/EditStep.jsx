import { useCaptionStore } from '../store/captionStore';

export function EditStep() {
  const { editedSegments, updateSegment, setCurrentStep } = useCaptionStore();

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Edit Transcription</h2>
        <p className="text-sm sm:text-base text-gray-600">Review and edit the transcription text. Click on any text to modify it.</p>
      </div>

      <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
        {editedSegments.map((segment, index) => (
          <div key={index} className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start p-3 sm:p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
            <div className="flex-shrink-0 min-w-16 sm:min-w-20">
              <div className="text-xs sm:text-sm font-mono text-gray-500">
                <div>{formatTime(segment.start)}</div>
                <div className="text-xs mt-1">→</div>
                <div>{formatTime(segment.end)}</div>
              </div>
            </div>

            <div className="flex-grow w-full sm:w-auto">
              <textarea
                value={segment.text}
                onChange={(e) => updateSegment(index, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                rows="2"
              />
            </div>

            <div className="flex-shrink-0">
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                {segment.text.split(/\s+/).filter(Boolean).length} words
              </div>
            </div>
          </div>
        ))}
      </div>

      {editedSegments.length === 0 && (
        <div className="p-6 sm:p-8 text-center bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm sm:text-base text-gray-500">No segments to display</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between pt-6 border-t border-gray-200">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          Start Over
        </button>
        <button
          onClick={() => setCurrentStep('styling')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          Next: Caption Styling →
        </button>
      </div>
    </div>
  );
}
