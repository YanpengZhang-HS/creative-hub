import type { RetryConfig } from 'retry-axios';

type HttpRequestRetryStrategy = RetryConfig['backoffType'];

/**
 * Http Request Retry config.
 *
 * The flow of retry is Original Request -> Request Interceptors -> Request Failed -> Should Retry callback
 * -> On Retry Attempt callback -> Retry Request -> Request Interceptors -> (Sucess or Retry) -> Response Interceptors.
 */
interface HttpRequestRetryConfig {
  /**
   * The maximum number of times to retry the request.
   * @defaults 3.
   */
  max?: number;
  /**
   * The HTTP Methods that will be automatically retried.
   * @defaults ['GET','PUT','HEAD','OPTIONS','DELETE'] only Idempotent methods
   */
  httpMethods?: string[];
  /**
   * The HTTP response status codes that will automatically be retried.
   *
   * 1xx - Retry (Informational, request still processing)
   *
   * 2xx - Do not retry (Success)
   *
   * 3xx - Do not retry (Redirect)
   *
   * 4xx - Do not retry (Client errors)
   *
   * 429 - Retry ("Too Many Requests")
   *
   * 5xx - Retry (Server errors)
   * @defaults [[100, 199], [429, 429], [500, 599]]
   */
  statusCodes?: number[][];
  /**
   * Function to invoke when a retry attempt is made.
   */
  onRetryAttempt?: HttpRetryAttemptFn;
  /**
   * Function to invoke which determines if you should retry
   */
  shouldRetry?: HttpShouldRetryFn;
  /**
   * When there is no response, the number of retries to attempt.
   * @defaults 2.
   */
  noResponseRetries?: number;
  /**
   * Strategy- Linear, Static, Exponential.
   * @defaults Exponential
   */
  strategy?: HttpRequestRetryStrategy;
  /**
   * The amount of time to initially delay the retry. Works when retry strategy is Static only.
   * @defaults 100.
   */
  delay?: number;
}

type HttpRetryAttemptFn = (
  attempt: number,
  retryConfig: HttpRequestRetryConfig,
  error: unknown
) => void | Promise<void>;

type HttpShouldRetryFn = (retryConfig: HttpRequestRetryConfig, error: unknown) => boolean;

/**
 * Add retry config on axios so that internal library can operate on it
 */
declare module 'axios' {
  interface AxiosRequestConfig {
    retry?: HttpRequestRetryConfig;
  }
}

export type {
  HttpRequestRetryStrategy,
  HttpRequestRetryConfig,
  HttpRetryAttemptFn,
  HttpShouldRetryFn
};
