import axios from 'axios';
import type { AxiosInstance } from 'axios';

// Create base axios instance
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
      'Content-Type': 'application/json',
    }
  });

  // Add request interceptor to remove User-Agent header
  client.interceptors.request.use((config) => {
    // Remove User-Agent header
    if (config.headers) {
      delete config.headers['User-Agent'];
    }
    return config;
  });

  return client;
};

export const apiClient = createApiClient(); 