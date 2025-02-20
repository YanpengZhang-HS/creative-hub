import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import { attach } from 'retry-axios';
import { convertRetryToRaxConfig } from '../helpers';

const addOnHttpRequestRetry = (axios: AxiosInstance) => {
  axios.interceptors.request.use((request: AxiosRequestConfig) => ({
    ...request,
    raxConfig: {
      ...request.raxConfig,
      ...convertRetryToRaxConfig(axios, request.retry)
    }
  }));

  attach(axios);
};

export { addOnHttpRequestRetry };
