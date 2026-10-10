// High-speed in-memory + session request cache & in-flight deduplicator

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<any>>();

const DEFAULT_TTL_MS = 2 * 60 * 1000; // 2 minutes fresh TTL

export async function cachedFetchJson<T = any>(
  url: string,
  options?: { ttlMs?: number; forceRefresh?: boolean }
): Promise<T> {
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
  const now = Date.now();

  if (!options?.forceRefresh) {
    const cached = memoryCache.get(url);
    if (cached && now - cached.timestamp < ttlMs) {
      return cached.data as T;
    }
  }

  // Deduplicate concurrent identical GET requests
  const existingInFlight = inFlightRequests.get(url);
  if (existingInFlight) {
    return existingInFlight as Promise<T>;
  }

  const fetchPromise = fetch(url)
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      memoryCache.set(url, { data, timestamp: Date.now() });
      return data as T;
    })
    .finally(() => {
      inFlightRequests.delete(url);
    });

  inFlightRequests.set(url, fetchPromise);
  return fetchPromise;
}

export function getSyncCached<T = any>(url: string): T | null {
  const cached = memoryCache.get(url);
  return cached ? (cached.data as T) : null;
}

export function setSyncCached<T = any>(url: string, data: T): void {
  memoryCache.set(url, { data, timestamp: Date.now() });
}

export function invalidateApiCache(urlPrefix?: string): void {
  if (!urlPrefix) {
    memoryCache.clear();
  } else {
    for (const key of memoryCache.keys()) {
      if (key.startsWith(urlPrefix)) {
        memoryCache.delete(key);
      }
    }
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("products-updated"));
  }
}
