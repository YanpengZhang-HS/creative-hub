import type { Method } from 'axios';
import axios from 'axios';
import type {
  HttpCancellableResponse,
  HttpInterceptor,
  HttpRequestInterceptor,
  HttpResponseInterceptor,
  HttpRequestConfig,
  HttpResponse,
  IHttpService,
  HttpFactoryCallback
} from '../models';
import { addOnHttpErrorHandler } from './http-error-handler';
import { addOnHttpRequestRetry } from './http-request-retry';

/**
 * Create a new instance of the service.
 * @param config HttpRequestConfig for the service
 * @returns New Instance of HttpService
 */
const HttpServiceFactory = (
  config: HttpRequestConfig,
  callback?: HttpFactoryCallback
): IHttpService => {
  const axiosInstance = axios.create(config);

  addOnHttpRequestRetry(axiosInstance);
  addOnHttpErrorHandler(axiosInstance);

  const addRequestInterceptor = ({ onIntercept, onError }: HttpRequestInterceptor) => {
    axiosInstance.interceptors.request.use(onIntercept, onError);
  };

  const addResponseInterceptor = ({ onIntercept, onError }: HttpResponseInterceptor) => {
    axiosInstance.interceptors.response.use(onIntercept, onError);
  };

  const addInterceptors = (interceptors: HttpInterceptor[]) => {
    interceptors.forEach((interceptor) => {
      if (interceptor.type === 'request') {
        addRequestInterceptor(interceptor.value);
      } else {
        addResponseInterceptor(interceptor.value);
      }
    });
  };

  const getConfig = () => axiosInstance.defaults;

  const updateConfig = (newConfig: HttpRequestConfig) => {
    const oldConfig = getConfig();
    axiosInstance.defaults = {
      ...oldConfig,
      ...newConfig,
      retry: {
        ...oldConfig.retry,
        ...newConfig.retry
      }
    };
  };

  const request = <T>(
    method: Method,
    url: string,
    options?: HttpRequestConfig,
    data?: unknown
  ): HttpCancellableResponse<T> => {
    const { token: cancelToken, cancel } = axios.CancelToken.source();
    const startTime = Date.now();
    return {
      response: axiosInstance
        .request({ ...options, cancelToken, method, url, data })
        .then((response: HttpResponse<T>) => {
          if (typeof callback === 'function') {
            callback('success', response.status, Date.now() - startTime, url, options?.name);
          }
          return response;
        })
        .catch((error) => {
          if (typeof callback === 'function' && error.axiosError) {
            const {
              config: { url: apiUrl },
              response
            } = error.axiosError;
            callback('error', response?.status || 0, Date.now() - startTime, apiUrl, options?.name);
          }
          throw error;
        }),
      cancel
    };
  };

  const get = <T>(url: string, options?: HttpRequestConfig): HttpCancellableResponse<T> =>
    request<T>('GET', url, options);

  const put = <T>(
    url: string,
    data: unknown,
    options?: HttpRequestConfig
  ): HttpCancellableResponse<T> => request<T>('PUT', url, options, data);

  const post = <T>(
    url: string,
    data: unknown,
    options?: HttpRequestConfig
  ): HttpCancellableResponse<T> => request<T>('POST', url, options, data);

  return {
    addRequestInterceptor,
    addResponseInterceptor,
    addInterceptors,
    updateConfig,
    getConfig,
    request,
    get,
    put,
    post
  };
};

export { HttpServiceFactory };