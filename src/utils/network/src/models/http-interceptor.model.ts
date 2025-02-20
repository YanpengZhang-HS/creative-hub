import type { HttpRequestConfig } from './http-request.model';
import type { HttpResponse } from './http-response.model';

interface HttpRequestInterceptor {
  onIntercept(request: HttpRequestConfig): HttpRequestConfig | Promise<HttpRequestConfig>;
  onError(error: unknown): never;
}

interface HttpResponseInterceptor {
  onIntercept(response: HttpResponse): HttpResponse | Promise<HttpResponse>;
  onError(error: unknown): never | Promise<never>;
}

type HttpInterceptor =
  | {
      type: 'request';
      value: HttpRequestInterceptor;
    }
  | {
      type: 'response';
      value: HttpResponseInterceptor;
    };

export type { HttpRequestInterceptor, HttpResponseInterceptor, HttpInterceptor };
