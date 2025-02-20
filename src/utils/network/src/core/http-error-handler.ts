import type { AxiosInstance } from 'axios';

const decorateError = (error: unknown) => error;

const addOnHttpErrorHandler = (axiosInstance: AxiosInstance) => {
  axiosInstance.interceptors.response.use(undefined, (error: unknown) => {
    throw decorateError(error);
  });
};

export { addOnHttpErrorHandler, decorateError };
