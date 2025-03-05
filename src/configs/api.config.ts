export const API_CONFIG = {
  BASE_URL: process.env.API_BASE_URL || 'http://34.227.168.212:8000',
  ENDPOINTS: {
    TASKS: '/api/v1/tasks',
  },
  getVideoUrl: (taskId: string) => 
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TASKS}/${taskId}/files/output%2Foutput.mp4`,
  getImageUrl: (taskId: string) => 
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TASKS}/${taskId}/files/output%2Foutput.png`,
}; 