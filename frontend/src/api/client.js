import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const videoAPI = {
  // Upload and caption a video
  captionVideo: async (formData) => {
    const response = await client.post('/videos/caption', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get task status
  getTaskStatus: async (taskId) => {
    const response = await client.get(`/videos/tasks/${taskId}`);
    return response.data;
  },

  // Get transcription from a task
  getTranscription: async (taskId) => {
    const response = await client.get(`/videos/tasks/${taskId}/transcription`);
    return response.data;
  },

  // Reprocess with edited transcription
  reprocessVideo: async (taskId, segments, captionConfig) => {
    const response = await client.post('/videos/reprocess', {
      task_id: taskId,
      segments,
      caption_config: captionConfig,
    });
    return response.data;
  },

  // Download processed video
  downloadVideo: async (filename) => {
    return `/api/v1/videos/download/${filename}`;
  },

  // Get available styles
  getStyles: async () => {
    const response = await client.get('/videos/styles');
    return response.data;
  },

  // Get video thumbnail URL
  getThumbnail: (taskId) => {
    return `${API_BASE_URL}/videos/tasks/${taskId}/thumbnail`;
  },
};

export default client;
