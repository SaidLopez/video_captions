import { create } from 'zustand';

export const useCaptionStore = create((set) => ({
  // Current workflow state
  currentStep: 'upload', // upload, processing, edit, styling, reprocessing, download

  // Task and video data
  taskId: null,
  videoFile: null,
  videoFileName: null,

  // Transcription data
  transcription: null,
  editedSegments: [],
  originalSegments: [],

  // Caption styling
  captionConfig: {
    style: 'tiktok',
    position: 'bottom',
    font_size: 48,
    font_color: '#FFFFFF',
    font_weight: 'bold',
    stroke_color: '#000000',
    stroke_width: 3,
    background_color: null,
    background_opacity: 0.7,
    highlight_color: '#FFFF00',
    highlight_current_word: true,
    max_words_per_line: 5,
    animation: true,
  },

  // Task progress
  progress: 0,
  taskStatus: null,
  errorMessage: null,

  // Available styles
  availableStyles: [],

  // Actions
  setCurrentStep: (step) => set({ currentStep: step }),

  setTaskId: (taskId) => set({ taskId }),

  setVideoFile: (file) => set({ videoFile: file, videoFileName: file?.name }),

  setTranscription: (transcription) => set({
    transcription,
    originalSegments: transcription?.segments || [],
    editedSegments: transcription?.segments || [],
  }),

  updateSegment: (index, text) => set((state) => {
    const newSegments = [...state.editedSegments];
    if (newSegments[index]) {
      newSegments[index] = { ...newSegments[index], text };
    }
    return { editedSegments: newSegments };
  }),

  setCaptionConfig: (config) => set({ captionConfig: config }),

  updateCaptionConfig: (updates) => set((state) => ({
    captionConfig: { ...state.captionConfig, ...updates },
  })),

  setProgress: (progress) => set({ progress }),

  setTaskStatus: (status) => set({ taskStatus: status }),

  setErrorMessage: (message) => set({ errorMessage: message }),

  setAvailableStyles: (styles) => set({ availableStyles: styles }),

  reset: () => set({
    currentStep: 'upload',
    taskId: null,
    videoFile: null,
    videoFileName: null,
    transcription: null,
    editedSegments: [],
    originalSegments: [],
    progress: 0,
    taskStatus: null,
    errorMessage: null,
  }),
}));
