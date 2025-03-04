import { useEffect, useState } from 'react';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean; // Whether to return stale data while fetching fresh data
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  isStale: boolean;
}

// In-memory cache store
const cacheStore: Record<string, CacheEntry<any>> = {};

// Default cache options
const DEFAULT_CACHE_OPTIONS: CacheOptions = {
  ttl: 5 * 60 * 1000, // 5 minutes
  staleWhileRevalidate: true,
};

/**
 * Checks if a cache entry is stale
 */
const isStale = (entry: CacheEntry<any>, ttl: number): boolean => {
  return Date.now() - entry.timestamp > ttl;
};

/**
 * Sets data in the cache
 */
export const setCache = <T>(key: string, data: T, options: CacheOptions = {}): void => {
  const { ttl = DEFAULT_CACHE_OPTIONS.ttl } = options;
  
  cacheStore[key] = {
    data,
    timestamp: Date.now(),
    isStale: false,
  };
  
  // Set expiration if TTL is provided
  if (ttl) {
    setTimeout(() => {
      if (cacheStore[key]) {
        cacheStore[key].isStale = true;
      }
    }, ttl);
  }
};

/**
 * Gets data from the cache
 */
export const getCache = <T>(key: string): CacheEntry<T> | null => {
  const entry = cacheStore[key] as CacheEntry<T>;
  if (!entry) return null;
  return entry;
};

/**
 * Invalidates a cache entry
 */
export const invalidateCache = (key: string): void => {
  delete cacheStore[key];
};

/**
 * Invalidates all cache entries that match a pattern
 */
export const invalidateCacheByPattern = (pattern: string): void => {
  const regex = new RegExp(pattern);
  Object.keys(cacheStore).forEach((key) => {
    if (regex.test(key)) {
      delete cacheStore[key];
    }
  });
};

/**
 * Clears the entire cache
 */
export const clearCache = (): void => {
  Object.keys(cacheStore).forEach((key) => {
    delete cacheStore[key];
  });
};

/**
 * Hook for cached data fetching
 */
export const useCachedFetch = <T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): { data: T | null; loading: boolean; error: Error | null; refetch: () => Promise<void> } => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  const mergedOptions = { ...DEFAULT_CACHE_OPTIONS, ...options };
  
  const fetchData = async (skipCache = false): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // Check cache first if not skipping cache
      if (!skipCache) {
        const cachedData = getCache<T>(key);
        
        if (cachedData) {
          // If data is not stale or we're using stale-while-revalidate
          if (!cachedData.isStale || mergedOptions.staleWhileRevalidate) {
            setData(cachedData.data);
            setLoading(false);
            
            // If stale, revalidate in the background
            if (cachedData.isStale && mergedOptions.staleWhileRevalidate) {
              fetchData(true);
            }
            
            return;
          }
        }
      }
      
      // Fetch fresh data
      const freshData = await fetchFn();
      setData(freshData);
      setCache(key, freshData, mergedOptions);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [key]);
  
  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
  };
};

/**
 * Hook for cached data with automatic revalidation
 */
export const useCachedData = <T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions & { revalidateInterval?: number } = {}
): { data: T | null; loading: boolean; error: Error | null; refetch: () => Promise<void> } => {
  const { revalidateInterval, ...cacheOptions } = options;
  const result = useCachedFetch<T>(key, fetchFn, cacheOptions);
  
  useEffect(() => {
    if (!revalidateInterval) return;
    
    const intervalId = setInterval(() => {
      result.refetch();
    }, revalidateInterval);
    
    return () => clearInterval(intervalId);
  }, [revalidateInterval]);
  
  return result;
}; 