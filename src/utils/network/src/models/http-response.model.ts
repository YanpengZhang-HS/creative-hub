import type { AxiosResponse, Canceler } from 'axios';
import type { HttpRequestConfig } from './http-request.model';

interface HttpResponse<T = unknown> extends AxiosResponse<T> {
  /**
   * Config applicable for the request
   */
  config: HttpRequestConfig;
  /**
   * Type of Request
   */
  request?: XMLHttpRequest;
}

interface HttpCancellableResponse<T> {
  response: Promise<HttpResponse<T>>;
  cancel: Canceler;
}

export type { HttpResponse, HttpCancellableResponse };
