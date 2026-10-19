/**
 * Simple in-memory sliding-window rate limiter, keyed by client IP.
 *
 * NOTE: this is intentionally per-process memory. For multi-instance
 * production deployments, replace with a shared store (e.g. Upstash Redis).
 */

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  /** Requests remaining in the current window. */
  remaining: number;
  /** Seconds until the oldest request leaves the window. */
  retryAfterSecs: number;
  limit: number;
}

export function checkRateLimit(
  key: string,
  limitPerHour: number,
  now: number = Date.now()
): RateLimitResult {
  const windowMs = 60 * 60 * 1000;
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(key, bucket);
  }
  // Drop entries outside the window.
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limitPerHour) {
    const oldest = bucket.timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      retryAfterSecs: Math.ceil((oldest + windowMs - now) / 1000),
      limit: limitPerHour,
    };
  }

  bucket.timestamps.push(now);

  // Opportunistic cleanup so the map can't grow forever.
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) {
      if (b.timestamps.length === 0 || now - b.timestamps[b.timestamps.length - 1] > windowMs) {
        buckets.delete(k);
      }
    }
  }

  return {
    allowed: true,
    remaining: limitPerHour - bucket.timestamps.length,
    retryAfterSecs: 0,
    limit: limitPerHour,
  };
}

/** Test helper: reset all buckets. */
export function resetRateLimits(): void {
  buckets.clear();
}
