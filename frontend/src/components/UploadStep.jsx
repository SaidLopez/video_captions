import { useState } from 'react';
import { videoAPI } from '../api/client';
import { useCaptionStore } from '../store/captionStore';

export function UploadStep() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const { setVideoFile, setTaskId, setCurrentStep, setProgress, setTaskStatus, setErrorMessage } = useCaptionStore();

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await uploadVideo(files[0]);
    }
  };

  const handleFileInput = async (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      await uploadVideo(files[0]);
    }
  };

  const uploadVideo = async (file) => {
    setIsUploading(true);
    setError(null);

    try {
      // Validate file type
      const validExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (!validExtensions.includes(fileExtension)) {
        throw new Error(`Invalid file type. Allowed: ${validExtensions.join(', ')}`);
      }

      // Validate file size (500MB max)
      if (file.size > 500 * 1024 * 1024) {
        throw new Error('File size exceeds 500MB limit');
      }

      setVideoFile(file);

      // Create FormData
      const formData = new FormData();
      formData.append('video', file);
      formData.append('style', 'tiktok');
      formData.append('position', 'bottom');

      // Upload and start processing
      const response = await videoAPI.captionVideo(formData);

      setTaskId(response.task_id);
      setProgress(response.progress);
      setTaskStatus(response.status);
      setCurrentStep('processing');
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      setError(errorMsg);
      setErrorMessage(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Upload Video</h2>
        <p className="text-sm sm:text-base text-gray-600">Upload a video file to add captions and edit the transcription</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 sm:p-12 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
      >
        <svg
          className="mx-auto h-10 sm:h-12 w-10 sm:w-12 text-gray-400 mb-4"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V20m-10-5l-6 6m0 0l-6-6m6 6v16"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <p className="text-gray-600 mb-2 text-sm sm:text-base">
          <span className="font-semibold">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs sm:text-sm text-gray-500 mb-6">
          MP4, MOV, AVI, MKV, WebM up to 500MB
        </p>

        <input
          type="file"
          accept="video/*"
          onChange={handleFileInput}
          disabled={isUploading}
          className="hidden"
          id="video-upload"
        />
        <button
          onClick={() => document.getElementById('video-upload').click()}
          disabled={isUploading}
          className="px-6 py-3 sm:py-2 sm:px-6 w-full sm:w-auto bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? 'Uploading...' : 'Select File'}
        </button>
      </div>

      <div className="mt-8 p-4 sm:p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-3">What happens next:</h3>
        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
          <li>Your video will be processed and transcribed using AI</li>
          <li>You'll be able to edit the transcription text</li>
          <li>Customize caption styling and appearance</li>
          <li>Download the final video with your edited captions</li>
        </ol>
      </div>
    </div>
  );
}
