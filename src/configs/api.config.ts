export const API_CONFIG = {
  BASE_URL: 'http://34.227.168.212:8000',
  ENDPOINTS: {
    TASKS: '/api/v1/tasks',
  },
  getVideoUrl: (taskId: string) => 
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TASKS}/${taskId}/files/output%2Foutput.mp4`,
}; 