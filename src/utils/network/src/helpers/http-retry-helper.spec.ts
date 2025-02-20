import type { AxiosError, AxiosInstance } from 'axios';
import { NetworkError } from '../errors';
import {
  convertRaxToRetryConfig,
  convertRetryToRaxConfig,
  onCustomRetryAttempt,
  onCustomShouldRetry
} from './http-retry-helper';

const stub = () => {
  throw new Error('stub');
};

const getAxiosInstance = (defaults: AxiosInstance['defaults'] = {}): AxiosInstance => {
  const axiosInstance = () => {
    throw new Error('axios instance stub');
  };

  axiosInstance.defaults = defaults;

  axiosInstance.interceptors = {
    request: {
      use: stub,
      eject: stub
    },
    response: {
      use: stub,
      eject: stub
    }
  };

  axiosInstance.getUri = stub;
  axiosInstance.request = stub;
  axiosInstance.get = stub;
  axiosInstance.delete = stub;
  axiosInstance.head = stub;
  axiosInstance.options = stub;
  axiosInstance.post = stub;
  axiosInstance.put = stub;
  axiosInstance.patch = stub;

  return axiosInstance;
};

const getAxiosError = (config: AxiosError['config'] = {}): AxiosError => ({
  config,
  isAxiosError: true,
  toJSON: stub,
  name: 'Error',
  message: 'something went wrong'
});

describe('HttpRetry Helper', () => {
  it('should convert retry->raxConfig', () => {
    const instance = getAxiosInstance();
    expect(
      convertRetryToRaxConfig(instance, {
        delay: 10,
        httpMethods: ['GET'],
        max: 4,
        noResponseRetries: 10,
        strategy: 'linear',
        statusCodes: [[100, 100]]
      })
    ).toStrictEqual({
      backoffType: 'linear',
      httpMethodsToRetry: ['GET'],
      instance,
      noResponseRetries: 10,
      onRetryAttempt: undefined,
      retry: 4,
      retryDelay: 10,
      shouldRetry: undefined,
      statusCodesToRetry: [[100, 100]]
    });
  });

  it('should convert raxConfig->retry', () => {
    expect(
      convertRaxToRetryConfig({
        backoffType: 'linear',
        httpMethodsToRetry: ['GET'],
        noResponseRetries: 10,
        onRetryAttempt: undefined,
        retry: 4,
        retryDelay: 10,
        shouldRetry: undefined,
        statusCodesToRetry: [[100, 100]]
      })
    ).toStrictEqual({
      delay: 10,
      httpMethods: ['GET'],
      max: 4,
      noResponseRetries: 10,
      strategy: 'linear',
      statusCodes: [[100, 100]]
    });
  });

  it('should return custom callback for onRetryAttempt', () => {
    const mock = jest.fn();
    const rax = convertRetryToRaxConfig(getAxiosInstance(), {
      onRetryAttempt: mock
    });
    const error = getAxiosError({ raxConfig: {} });

    expect(rax.onRetryAttempt).toBeDefined();

    if (rax.onRetryAttempt) {
      rax.onRetryAttempt(error);
    }

    expect(mock).toHaveBeenCalledWith(
      1,
      {
        delay: undefined,
        httpMethods: undefined,
        max: undefined,
        noResponseRetries: undefined,
        statusCodes: undefined,
        strategy: undefined
      },
      error
    );
  });

  it('should return custom callback for onShouldRetry', () => {
    const mock = jest.fn();
    const rax = convertRetryToRaxConfig(getAxiosInstance(), {
      shouldRetry: mock
    });
    const error = getAxiosError({
      raxConfig: {
        currentRetryAttempt: 2
      }
    });

    expect(rax.shouldRetry).toBeDefined();

    if (rax.shouldRetry) {
      rax.shouldRetry(error);
    }

    expect(mock).toHaveBeenCalledWith(
      {
        delay: undefined,
        httpMethods: undefined,
        max: undefined,
        noResponseRetries: undefined,
        statusCodes: undefined,
        strategy: undefined
      },
      new NetworkError(error)
    );
  });

  it('should call the onCustomRetryAttempt callback function', () => {
    const mock = jest.fn();
    const error = new NetworkError(getAxiosError({ raxConfig: {} }));
    onCustomRetryAttempt(error, mock);
    expect(mock).toHaveBeenCalledWith(
      1,
      {
        delay: undefined,
        httpMethods: undefined,
        max: undefined,
        noResponseRetries: undefined,
        statusCodes: undefined,
        strategy: undefined
      },
      error
    );
  });

  it('should call the onCustomShouldRetry callback function', () => {
    const mock = jest.fn();
    const error = new NetworkError(
      getAxiosError({
        raxConfig: {
          currentRetryAttempt: 2
        }
      })
    );
    onCustomShouldRetry(error, mock);
    expect(mock).toHaveBeenCalledWith(
      {
        delay: undefined,
        httpMethods: undefined,
        max: undefined,
        noResponseRetries: undefined,
        statusCodes: undefined,
        strategy: undefined
      },
      error
    );
  });

  it('should convert to raxConfig on empty retry config', () => {
    const instance = getAxiosInstance({ responseType: 'arraybuffer' });
    expect(convertRetryToRaxConfig(instance, undefined)).toStrictEqual({
      backoffType: undefined,
      httpMethodsToRetry: undefined,
      instance,
      noResponseRetries: undefined,
      onRetryAttempt: undefined,
      retry: undefined,
      retryDelay: undefined,
      shouldRetry: undefined,
      statusCodesToRetry: undefined
    });
  });

  it('should convert with empty configs on the error', () => {
    const attemptMock = jest.fn();
    const retryMock = jest.fn();
    const rax = convertRetryToRaxConfig(getAxiosInstance(), {
      onRetryAttempt: attemptMock,
      shouldRetry: retryMock
    });
    const error = getAxiosError();

    if (rax.onRetryAttempt) {
      rax.onRetryAttempt(error);
    }

    if (rax.shouldRetry) {
      rax.shouldRetry(error);
    }

    expect(attemptMock).toHaveBeenCalledWith(
      1,
      {
        delay: undefined,
        httpMethods: undefined,
        max: undefined,
        noResponseRetries: undefined,
        statusCodes: undefined,
        strategy: undefined
      },
      error
    );
    expect(retryMock).toHaveBeenCalledWith(
      {
        delay: undefined,
        httpMethods: undefined,
        max: undefined,
        noResponseRetries: undefined,
        statusCodes: undefined,
        strategy: undefined
      },
      new NetworkError(error)
    );
  });
});
