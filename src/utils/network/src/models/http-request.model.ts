import type { AxiosRequestConfig } from 'axios';
import type { HttpRequestRetryConfig } from './http-retry.model';

/**
 * Common HTTP configuration
 */
interface HttpRequestConfig extends AxiosRequestConfig {
  headers?: { [header: string]: string | string[] };
  name?: string;
  params?: {
    [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>;
  };
  retry?: HttpRequestRetryConfig;
}

export type { HttpRequestConfig };
