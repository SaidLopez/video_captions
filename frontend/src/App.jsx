import './App.css';
import { useCaptionStore } from './store/captionStore';
import { UploadStep } from './components/UploadStep';
import { ProcessingStep } from './components/ProcessingStep';
import { EditStep } from './components/EditStep';
import { ReprocessingStep } from './components/ReprocessingStep';
import { DownloadStep } from './components/DownloadStep';

function App() {
  const { currentStep } = useCaptionStore();

  // Visual steps only
  const steps = [
    { id: 'upload', label: 'Upload', icon: '📤' },
    { id: 'edit', label: 'Edit', icon: '✏️' },
    { id: 'export', label: 'Export', icon: '🚀' },
  ];

  // Map internal detailed states to visual step indices
  const getVisualStepIndex = (internalStep) => {
    switch (internalStep) {
      case 'upload':
      case 'processing': // Processing is part of step 1 completion/transition
        return 0;
      case 'edit':
        return 1;
      case 'render': // Rendering is start of step 3
      case 'download': // Download is completion of step 3
        return 2;
      default:
        return 0;
    }
  };

  const currentStepIndex = getVisualStepIndex(currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
            <span className="text-2xl sm:text-3xl">🎬</span>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Video Captions Editor</h1>
          </div>
          <p className="text-sm sm:text-base text-gray-600">Upload videos, edit transcriptions, customize captions</p>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center gap-1 sm:gap-2 justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                <div
                  className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full text-xs sm:text-sm font-semibold flex-shrink-0 transition-all ${index <= currentStepIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                    }`}
                >
                  {index < currentStepIndex ? (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="hidden sm:block text-center flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-600 truncate">{step.label}</p>
                </div>

                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 sm:h-1 flex-1 min-w-0 transition-all ${index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-12">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8">
          {currentStep === 'upload' && <UploadStep />}
          {currentStep === 'processing' && <ProcessingStep />}
          {currentStep === 'edit' && <EditStep />}
          {currentStep === 'render' && <ReprocessingStep />}
          {currentStep === 'download' && <DownloadStep />}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-6 sm:py-8 mt-8 sm:mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs sm:text-sm">
          <p>🎬 Video Captions Editor - Transform your videos with AI-powered transcription and custom captions</p>
          <p className="mt-2 text-xs">Powered by FastAPI, Whisper AI, and FFmpeg</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
