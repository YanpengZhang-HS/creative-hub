import type { Method } from 'axios';
import type {
  HttpRequestInterceptor,
  HttpResponseInterceptor,
  HttpInterceptor
} from './http-interceptor.model';
import type { HttpRequestConfig } from './http-request.model';
import type { HttpCancellableResponse } from './http-response.model';

export type HttpFactoryCallback = (
  type: string,
  status: number,
  responseTime: number,
  url?: string,
  name?: string
) => void;
export interface IHttpService {
  /**
   * Add request interceptor
   * @param interceptor HttpRequestInterceptor Instance
   *
   * CAUTION: The request interceptor will be added in reverse sequence as of now. Mind while using this.
   */
  addRequestInterceptor(interceptor: HttpRequestInterceptor): void;

  /**
   * Add response interceptor
   * @param interceptor HttpResponseInterceptor Instance
   */
  addResponseInterceptor(interceptor: HttpResponseInterceptor): void;

  /**
   * Add Request & Responses interceptors
   * @param interceptors Requst + Response Interceptors with their token
   *
   * CAUTION: The request interceptors will be added in reverse sequence as of now. Mind while using this.
   */
  addInterceptors(interceptors: HttpInterceptor[]): void;

  /**
   * Update the config for the http instance
   * @param config
   */
  updateConfig(config: HttpRequestConfig, isPreloadCacheEnabled_?: boolean): void;

  /**
   * Returns the config for the http instance
   * @returns Read only config
   */
  getConfig(): Readonly<HttpRequestConfig>;

  /**
   * Constructs a generic request with default type as `unknown` for response. In case type is passed as generics e.g. `<ResponseType>`
   * then the response will be of type `ResponseType`.
   *
   * DISCLAIMER: Passing the explicit type doesn't mean that check work for the runtime too. User must check the type of data recieved if
   * API response changes frequently.
   * @param method  The HTTP method.
   * @param url     The endpoint URL.
   * @param options The HTTP options to send with the request.
   * @param data    Request Body.
   *  @param preloadSessionId  An unique id for preloader
   * @returns A cancellable Request.
   */
  request<T>(
    method: Method,
    url: string,
    options?: HttpRequestConfig,
    data?: unknown,
    preloadSessionId?: string
  ): HttpCancellableResponse<T>;

  /**
   * Constructs a GET request with default type as `unknown` for response. In case type is passed as generics e.g. `<ResponseType>`
   * then the response will be of type `ResponseType`.
   *
   * DISCLAIMER: Passing the explicit type doesn't mean that check work for the runtime too. User must check the type of data recieved if
   * API response changes frequently.
   * @param url     The endpoint URL.
   * @param options The HTTP options to send with the request.
   * @return A cancellable Request.
   */
  get<T>(url: string, options?: HttpRequestConfig): HttpCancellableResponse<T>;

  /**
   * Constructs a PUT request with default type as `unknown` for response. In case type is passed as generics e.g. `<ResponseType>`
   * then the response will be of type `ResponseType`.
   *
   * DISCLAIMER: Passing the explicit type doesn't mean that check work for the runtime too. User must check the type of data recieved if
   * API response changes frequently.
   * @param url     The endpoint URL.
   * @param data    Request Body.
   * @param options The HTTP options to send with the request.
   * @return A cancellable Request.
   */
  put<T>(url: string, data: unknown, options?: HttpRequestConfig): HttpCancellableResponse<T>;

  /**
   * Constructs a POST request with default type as `unknown` for response. In case type is passed as generics e.g. `<ResponseType>`
   * then the response will be of type `ResponseType`.
   *
   * DISCLAIMER: Passing the explicit type doesn't mean that check work for the runtime too. User must check the type of data recieved if
   * API response changes frequently.
   * @param url     The endpoint URL.
   * @param data    Request Body.
   * @param options The HTTP options to send with the request.
   * @returns A cancellable Request.
   */
  post<T>(url: string, data: unknown, options?: HttpRequestConfig): HttpCancellableResponse<T>;
}
