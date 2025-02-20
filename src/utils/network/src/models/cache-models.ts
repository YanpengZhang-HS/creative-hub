/* eslint-disable @typescript-eslint/no-explicit-any */
import type { HttpResponse } from './http-response.model';

/**
 * SESSION: user's session. Once the user kills the application, the cache data stored for that application session should be cleared;
 * CROSS_SESSION: exist across different sessions/application lifecycles;
 * ACCSEE: expire upon access, it will be utilized only once.
 */
enum ExpiryPolicy {
  SESSION = 'session',
  CROSS_SESSION = 'cross-session',
  ACCSEE = 'access-expire'
}

enum CacheExpiryPolicy {
  CACHE_EXPIRY_POLICY_UNSPECIFIED = 0,
  CACHE_EXPIRY_POLICY_ACCESS = 1,
  CACHE_EXPIRY_POLICY_SESSION = 2,
  CACHE_EXPIRY_POLICY_CROSS_SESSION = 3
}

enum CacheDeleteReason {
  CACHE_DELETE_REASON_UNSPECIFIED = 0,
  /** CACHE_DELETE_REASON_EXPIRED - (When deleted due to expiry) */
  CACHE_DELETE_REASON_EXPIRED = 1,
  /** CACHE_DELETE_REASON_VACATED - (When deleted to fit the new entry) */
  CACHE_DELETE_REASON_VACATED = 2,
  /** CACHE_DELETE_REASON_INVALIDATED - (When deleted due to app events like pid changed) */
  CACHE_DELETE_REASON_INVALIDATED = 3
}

type CacheControl = {
  expiryPolicy?: ExpiryPolicy;
  maxAge: string;
};

type setCachedResponseProps = {
  cacheKey: string;
  preloadSessionId: string;
  response: any;
  cacheControl?: CacheControl;
  dataSize: number;
};

type MemoryCacheType = {
  getCachedResponse: (cacheKey: string) => CacheDataType | undefined;
  setCachedResponse: (props: setCachedResponseProps) => boolean;
  clearCache: (cacheKey: string) => void;
};

type CacheDataType = {
  response: any;
  cacheMetadata: {
    preloadSessionId?: string;
    expirationTime: number;
    dataSize: number;
    expiryPolicy?: ExpiryPolicy;
    maxAge?: string;
  };
};

interface MemoryCacheConfig {
  maximumEntry?: number;
  cacheMaxSizeMB?: number;
}

type CacheKeyConfig = {
  listOfExclusionQueryParams?: string[];
  listOfIncludingQueryParams?: string[];
};

type CacheManagerType = {
  getCachedResponse: (requestUrl: string) => any;
  setCachedResponse: (
    requestUrl: string,
    cacheData: any,
    preloadSessionId: string
  ) => Promise<boolean>;
  setOnGoingRequest: (requestUrl: string, request: Promise<HttpResponse<any>>) => void;
  getOnGoingRequest: (requestUrl: string) => Promise<HttpResponse<any>> | undefined;
  deleteResponse: (requestUrl: string) => void;
  deleteOnGoingRequest: (requestUrl: string) => void;
  clearCache: () => void;
  updateCachingConfig: (config: CacheKeyConfig) => void;
};

type ReportCacheEvent = {
  reportCacheWrite: (cacheWriteProps: any) => Promise<void>;
  reportCacheHit: (cacheHitProps: any) => Promise<void>;
  reportCacheDelete: (cacheDeleteProps: any) => Promise<void>;
  reportCacheClear: (cacheDeleteProps: any) => Promise<void>;
};

type CacheManagerConfig = {
  maxAgeUpperbound?: number;
  cacheControlConfig?: {
    [key: string]: string;
  };
  listOfExclusionQueryParams?: string[];
  listOfIncludingQueryParams?: string[];
  memoryCacheConfig?: MemoryCacheConfig;
  diskCacheConfig?: DiskCacheConfig;
  isWebTV?: boolean;
};

/* interface for disk cache */

type DbIndex = { key: string; keyOption?: IDBIndexParameters };

type DbStore = {
  storeName: string;
  option?: IDBObjectStoreParameters;
  indexes?: DbIndex[];
};

type DiskCacheConfig = {
  dbName: string;
  dbVersion?: number;
  stores?: DbStore;
  cacheMaxSizeMB?: number;
  enableSessionCache?: boolean;
};

type DbSchema = CacheDataType & {
  cacheKey: string;
  accessTime: number;
};

type LRUDiskCacheType = {
  getDBfromWindow(): IDBFactory;
  openDB(): Promise<IDBDatabase>;
  set<T extends DbSchema>(key: string, data: T): Promise<boolean>;
  get<T extends DbSchema>(key: string): Promise<T | undefined>;
  update<T extends DbSchema>(key: string, data: T): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  deleteAll(): Promise<boolean>;
  getCurrentCacheSize(): number;
};

export { ExpiryPolicy, CacheExpiryPolicy, CacheDeleteReason };
export type {
  CacheControl,
  setCachedResponseProps,
  MemoryCacheType,
  MemoryCacheConfig,
  CacheDataType,
  CacheManagerConfig,
  CacheManagerType,
  CacheKeyConfig,
  ReportCacheEvent,
  LRUDiskCacheType,
  DbIndex,
  DbStore,
  DbSchema,
  DiskCacheConfig
};
