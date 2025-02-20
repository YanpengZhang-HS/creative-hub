import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import { HttpServiceFactory } from './http-service';
import type { IHttpService } from '../models';
import type { CacheManager } from '../cache-manager';
import { getCacheManager } from '../cache-manager';

const stub = () => {
  throw new Error('stub');
};

let useRequestInterceptor: jest.Mock;
let useResponseInterceptor: jest.Mock;
let axiosRequest: jest.Mock;

const getAxiosInstance = (defaults: AxiosInstance['defaults'] = {}): AxiosInstance => {
  const axiosInstance = () => {
    throw new Error('axios instance stub');
  };

  axiosInstance.defaults = defaults;

  axiosInstance.interceptors = {
    request: {
      use: useRequestInterceptor,
      eject: stub
    },
    response: {
      use: useResponseInterceptor,
      eject: stub
    }
  };

  axiosInstance.getUri = stub;
  axiosInstance.request = axiosRequest;
  axiosInstance.get = stub;
  axiosInstance.delete = stub;
  axiosInstance.head = stub;
  axiosInstance.options = stub;
  axiosInstance.post = stub;
  axiosInstance.put = stub;
  axiosInstance.patch = stub;

  return axiosInstance;
};

const onIntercept = stub;
const onError = stub;
const interceptor = { onIntercept, onError };
const responseInterceptor = { type: 'response' as const, value: interceptor };
const requestInterceptor = { type: 'request' as const, value: interceptor };

const mockPrefetchResponse = {
  config: { method: 'get' },
  data: 'value',
  headers: {
    'x-hs-cache-control': 'max-age=31452000,expiry-policy=session',
    'content-length': '20'
  },
  status: 200
};

const cacheConfig = {
  memoryCacheConfig: { cacheMaxSizeMB: 5 },
  diskCacheConfig: {
    dbName: 'TestCache',
    dbVersion: 1
  },
  listOfExclusionQueryParams: ['prefetch'],
  listOfIncludingQueryParams: ['client-capabities']
};

const cacheReportEven = {
  reportCacheWrite: jest.fn(),
  reportCacheHit: jest.fn(),
  reportCacheDelete: jest.fn(),
  reportCacheClear: jest.fn()
};

describe('HttpService', () => {
  let httpService: IHttpService;

  const config = { headers: { auth: 'xxx' } };
  const cancelToken = { promise: Promise.resolve() };
  const url = 'test';
  const data = { test: 'dummy' };

  const config1 = {
    baseURL: 'https://hotstar.com/',
    retry: {
      max: 3
    }
  };

  const config2 = {
    timeout: 1000,
    retry: {
      delay: 1000
    }
  };

  const config3 = {
    baseURL: 'https://hotstar.com/',
    timeout: 1000,
    retry: {
      max: 3,
      delay: 1000
    }
  };

  const config4 = { headers: { auth: 'xxx' }, name: 'TEST' };

  beforeEach(() => {
    useRequestInterceptor = jest.fn();
    useResponseInterceptor = jest.fn();
    axiosRequest = jest.fn(({ url: requestUrl }) =>
      Promise.resolve({ data: requestUrl === 'fail' ? null : undefined, status: 200 })
    );
    const spy = jest.spyOn(axios, 'create');
    spy.mockImplementation(getAxiosInstance);
    httpService = HttpServiceFactory(config1);
  });

  it('should be defined', () => {
    expect(httpService).toBeDefined();
  });

  it('should make GET call', () => {
    httpService.get(url, config);
    expect(axiosRequest).toHaveBeenCalledWith({
      ...config,
      cancelToken,
      method: 'GET',
      url,
      data: undefined
    });
  });

  it('should make PUT call', () => {
    httpService.put(url, data, config);
    expect(axiosRequest).toHaveBeenCalledWith({
      ...config,
      cancelToken,
      method: 'PUT',
      url,
      data
    });
  });

  it('should make POST call', () => {
    httpService.post(url, data, config);
    expect(axiosRequest).toHaveBeenCalledWith({
      ...config,
      cancelToken,
      method: 'POST',
      url,
      data
    });
  });

  it('should make ANY call', () => {
    httpService.request('HEAD', url, config, data);
    expect(axiosRequest).toHaveBeenCalledWith({
      ...config,
      cancelToken,
      method: 'HEAD',
      url,
      data
    });
  });

  it('should update the config for axios and addon', () => {
    httpService.updateConfig(config2);
    const httpConfig = httpService.getConfig();
    expect(httpConfig).toStrictEqual(config3);
  });

  it('should add response interceptor', () => {
    httpService.addResponseInterceptor(interceptor);
    expect(useResponseInterceptor).toHaveBeenLastCalledWith(onIntercept, onError);
  });

  it('should add request interceptor', () => {
    httpService.addRequestInterceptor(interceptor);
    expect(useRequestInterceptor).toHaveBeenLastCalledWith(onIntercept, onError);
  });

  it('should add multiple interceptors', () => {
    httpService.addInterceptors([requestInterceptor, responseInterceptor]);
    expect(useRequestInterceptor).toHaveBeenLastCalledWith(onIntercept, onError);
    expect(useResponseInterceptor).toHaveBeenLastCalledWith(onIntercept, onError);
  });

  describe('HttpServiceFactory', () => {
    const { now } = Date;
    beforeAll(() => {
      Date.now = jest.fn(() => 0);
    });
    afterAll(() => {
      Date.now = now;
    });
    it('should create instance of HttpService', () => {
      expect(HttpServiceFactory(config)).toBeDefined();
    });
    it('should call callback function', () => {
      const callback = jest.fn();
      expect(callback).toBeCalledTimes(0);
      HttpServiceFactory(config4, callback)
        .get(url, config4)
        .response.then(() => {
          expect(callback).toHaveBeenCalledWith('success', 200, 0, url, config4.name);
        });
    });

    it('should cache the response when url includes prefetch=true and return the cached data when request second time without prefetch=true in url', async () => {
      const urlWithPrefetch =
        'https://hotstar.com/allowed-subpath?cachekey=unique_cache_key_access_session_111&prefetch=true';
      const urlWithoutPrefetch =
        'https://hotstar.com/allowed-subpath?cachekey=unique_cache_key_access_session_111';

      axiosRequest = jest.fn(({ url: requestUrl }) => {
        if (requestUrl === urlWithPrefetch) {
          return Promise.resolve(mockPrefetchResponse);
        }
        return Promise.resolve(undefined);
      });

      getCacheManager(cacheConfig, cacheReportEven);

      const networkInstance = HttpServiceFactory(config4);
      await networkInstance.request('GET', urlWithPrefetch).response;
      const res = await networkInstance.request('GET', urlWithoutPrefetch).response;
      expect(res).toEqual(mockPrefetchResponse);
    });

    it('should not cache the data in cache manager when prefetch is false or undefined', async () => {
      const urlWithoutPrefetch = 'https://hotstar.com/allowed-subpath';
      const urlWithPrefetchIsFalse =
        'https://hotstar.com/allowed-subpath?cachekey=unique_cache_key_access_session&prefetch=false';

      const cacheManager = getCacheManager();
      expect(cacheManager).toBeTruthy();
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      (cacheManager as CacheManager).setCachedResponse = jest.fn();

      axiosRequest = jest.fn(() => Promise.resolve(mockPrefetchResponse));

      const networkInstance = HttpServiceFactory(config4);

      await networkInstance.request('GET', urlWithoutPrefetch).response;
      expect(cacheManager?.setCachedResponse).toBeCalledTimes(0);
      await networkInstance.request('GET', urlWithPrefetchIsFalse).response;
      expect(cacheManager?.setCachedResponse).toBeCalledTimes(0);
    });

    it('should cache when prefetch=true', async () => {
      const urlWithPrefetch =
        'https://hotstar.com/allowed-subpath?cachekey=unique_cache_key_access_session_111&prefetch=true';

      const cacheManager = getCacheManager();
      expect(cacheManager).toBeTruthy();

      const networkInstance = HttpServiceFactory(config4);

      await networkInstance.request('GET', urlWithPrefetch).response;
      expect(cacheManager?.setCachedResponse).toBeCalledTimes(1);
    });

    it('should not cache when isPreloadCacheEnabled = false', async () => {
      const urlWithPrefetch =
        'https://hotstar.com/allowed-subpath?cachekey=unique_cache_key_access_session_111&prefetch=true';

      const cacheManager = getCacheManager();
      expect(cacheManager).toBeTruthy();

      const networkInstance = HttpServiceFactory(config4);
      networkInstance.updateConfig({}, false);

      await networkInstance.request('GET', urlWithPrefetch).response;
      expect(cacheManager?.setCachedResponse).toBeCalledTimes(0);

      networkInstance.updateConfig({}, true);
      await networkInstance.request('GET', urlWithPrefetch).response;
      expect(cacheManager?.setCachedResponse).toBeCalledTimes(1);
    });

    it('should only cache GET request', async () => {
      const urlWithPrefetch =
        'https://hotstar.com/allowed-subpath?cachekey=unique_cache_key_access_session_111&prefetch=true';

      const cacheManager = getCacheManager();
      expect(cacheManager).toBeTruthy();

      const networkInstance = HttpServiceFactory(config4);

      await networkInstance.request('POST', urlWithPrefetch).response;
      expect(cacheManager?.setCachedResponse).toBeCalledTimes(0);

      await networkInstance.request('HEAD', urlWithPrefetch).response;
      expect(cacheManager?.setCachedResponse).toBeCalledTimes(0);

      await networkInstance.request('PUT', urlWithPrefetch).response;
      expect(cacheManager?.setCachedResponse).toBeCalledTimes(0);
    });

    it('should not send request again when the prefetch request is ongoing', async () => {
      const urlWithPrefetch =
        'https://hotstar.com/allowed-subpath?cachekey=unique_cache_key_access_session_2&prefetch=true';
      const urlWithoutPrefetch =
        'https://hotstar.com/allowed-subpath?cachekey=unique_cache_key_access_session_2';

      axiosRequest = jest.fn(
        ({ url: requestUrl }) =>
          new Promise((resolve) => {
            setTimeout(() => {
              if (requestUrl === urlWithPrefetch) {
                resolve(mockPrefetchResponse);
              } else {
                resolve(undefined);
              }
            }, 2000);
          })
      );

      const sleep = (ms: number | undefined) => new Promise((resolve) => setTimeout(resolve, ms));

      const cacheManager = getCacheManager();
      expect(cacheManager).toBeTruthy();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let cachedOnGoingRequest: Promise<AxiosResponse<any>>;
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      (cacheManager as CacheManager).setOnGoingRequest = jest.fn((_url, cacheData) => {
        cachedOnGoingRequest = cacheData;
      });
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      (cacheManager as CacheManager).getOnGoingRequest = jest.fn(() => cachedOnGoingRequest);

      expect(cacheManager?.setOnGoingRequest).toBeCalledTimes(0);

      const networkInstance = HttpServiceFactory(config4);
      const prefetchRequest = networkInstance.request('GET', urlWithPrefetch);
      await sleep(500);
      expect(cacheManager?.setOnGoingRequest).toBeCalledTimes(1);
      await sleep(100);
      expect(axiosRequest).toBeCalledTimes(1);

      const secondRequest = networkInstance.request('GET', urlWithoutPrefetch);
      await sleep(100);
      expect(axiosRequest).toBeCalledTimes(1);

      const prefetchRes = await prefetchRequest.response;
      expect(prefetchRes).toEqual(mockPrefetchResponse);

      const res = await secondRequest.response;
      expect(res).toEqual(mockPrefetchResponse);
    });
  });
});
