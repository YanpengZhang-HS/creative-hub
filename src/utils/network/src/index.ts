import { HttpServiceFactory } from './core';
import { HttpRequestConfig } from './models';

export { shouldRetryRequest } from 'retry-axios';

// creating httpInstance
const maxRetryCount = 2;
const options: HttpRequestConfig = {
  retry: {
    httpMethods: ['GET', 'PUT', 'HEAD', 'OPTIONS', 'DELETE', 'POST'],
    statusCodes: [[500, 599]],
    strategy: 'exponential',
    max: maxRetryCount
  },
  // timeout for downstream apis should be 2 sec for server and 20s for browser
  timeout: typeof window === 'undefined' ? 2000 : 20000
};

const httpInstance = HttpServiceFactory(options);
  
const getNetworkInstance = () => httpInstance;

export default getNetworkInstance;
