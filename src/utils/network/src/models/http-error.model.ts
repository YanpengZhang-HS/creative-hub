import type { AxiosError } from 'axios';
import type { HttpRequestConfig } from './http-request.model';
import type { HttpResponse } from './http-response.model';

enum NetworkErrorCode {
  TIMEOUT = 102,
  ABORTED = 103,
  NETWORK = 104,
  INVALID = 301,
  CANCELLED = 401,
  UNKNOWN = 501
}

/**
 * Enum for Http Error types
 */
enum HttpErrorType {
  /**
   * Error when response have been recieved and response status is 4XX - 5XX. To get the exact response status
   * code  use error.response.code
   */
  RESPONSE = 'ERESPONSE',
  /**
   * Error when user cancels the request. To get the cancellation message use error.message
   */
  CANCELLED = 'ECANCELLED',
  /**
   * Error when there is client or server timeout.
   */
  TIMEDOUT = 'ETIMEDOUT',
  /**
   * Error when request is cancelled by browser/node.
   */
  ABORTED = 'ECONNABORTED',
  /**
   * When request was made but no response was received.
   * Error can be like CORS, Network Changed, No Internet, Network Reset etc.
   * Browser doesn't expose us the exact error happened.
   */
  NETWORK = 'ENETWORK',
  /**
   * Any other error. It can be due to JS code/browser/library or any unknown error.
   */
  OTHER = 'EOTHER',
  /**
   * Error due to token invalidations
   */
  AUTHENTICATION = 'EAUTHENTICATION'
}

/**
 * Error when Server returns response to the client.
 * 4XX - 5XX
 */
interface HttpError<T = unknown> extends AxiosError<T> {
  config: HttpRequestConfig;
  response?: HttpResponse<T>;
}

export { NetworkErrorCode, HttpErrorType };
export type { HttpError };
