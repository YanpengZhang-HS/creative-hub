import type { AxiosInstance } from 'axios';
import axios from 'axios';
import type { RetryConfig } from 'retry-axios';
import { getConfig } from 'retry-axios';
import { decorateError } from '../core/http-error-handler';
import type { HttpRequestRetryConfig, HttpRetryAttemptFn, HttpShouldRetryFn } from '../models';

/**
 * Convert raxConfig to HttpRequestRetryConfig
 * @param raxConfig retry-axios Retry Config
 * @returns HttpRequestRetryConfig
 */
const convertRaxToRetryConfig = (raxConfig: RetryConfig): HttpRequestRetryConfig => ({
  max: raxConfig.retry,
  delay: raxConfig.retryDelay,
  httpMethods: raxConfig.httpMethodsToRetry,
  statusCodes: raxConfig.statusCodesToRetry,
  noResponseRetries: raxConfig.noResponseRetries,
  strategy: raxConfig.backoffType
});

/**
 * Wraps user provided callback with extra parameters.
 * @param error Axios Error
 * @param callback User provided custom retry logic callback
 * @returns true if retry needs to be done else false.
 */
const onCustomShouldRetry = (error: unknown, callback: HttpShouldRetryFn): boolean => {
  // Always return the config from the error itself.
  // Not the global because each request can have different config and retry logic.
  const raxConfig: RetryConfig = (axios.isAxiosError(error) && getConfig(error)) || {};
  const retryConfig: HttpRequestRetryConfig = convertRaxToRetryConfig(raxConfig);
  return callback(retryConfig, decorateError(error));
};

/**
 * Wraps user provided callback with extra parameters
 * @param error Axios Error
 * @param callback User provided custom retry attempt callback
 * @returns void in case of synchronous action or Promise in case of async action.
 */
const onCustomRetryAttempt = (
  error: unknown,
  callback: HttpRetryAttemptFn
): void | Promise<void> => {
  // Always return the config from the error itself.
  // Not the global because each request can have different config and retry logic.
  const raxConfig: RetryConfig = (axios.isAxiosError(error) && getConfig(error)) || {};
  const retryConfig: HttpRequestRetryConfig = convertRaxToRetryConfig(raxConfig);
  return callback(raxConfig?.currentRetryAttempt || 1, retryConfig, error);
};

/**
 * Convert Retry Config to retry-axios config.
 * @param axios Axios instance
 * @param retryConfig Retry config passed by the consumer
 */
const convertRetryToRaxConfig = (
  axiosInstance: AxiosInstance,
  retryConfig?: HttpRequestRetryConfig
): RetryConfig => {
  const {
    max,
    delay,
    httpMethods,
    statusCodes,
    onRetryAttempt,
    shouldRetry,
    noResponseRetries,
    strategy
  } = retryConfig || {};

  // The library itself create the defaults. As, of know we don't have any defaults. So, don't pass default value
  return {
    retry: max,
    retryDelay: delay,
    instance: axiosInstance,
    httpMethodsToRetry: httpMethods,
    statusCodesToRetry: statusCodes,
    onRetryAttempt: onRetryAttempt
      ? (error: unknown) => onCustomRetryAttempt(error, onRetryAttempt)
      : undefined,
    shouldRetry: shouldRetry
      ? (error: unknown) => onCustomShouldRetry(error, shouldRetry)
      : undefined,
    noResponseRetries,
    backoffType: strategy
  };
};

export {
  convertRaxToRetryConfig,
  onCustomRetryAttempt,
  onCustomShouldRetry,
  convertRetryToRaxConfig
};
