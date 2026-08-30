// Hardening Pass #1: Advanced Rate Limiting with Per-User Tracking

interface RateLimitBucket {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitBucket>();
const CLEANUP_INTERVAL = 60000; // Clean up expired buckets every minute

// Start cleanup interval
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimitStore.entries()) {
    if (bucket.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const defaultLimits: Record<string, RateLimitConfig> = {
  auth: { maxRequests: 5, windowMs: 60000 }, // 5 per minute
  jobs: { maxRequests: 30, windowMs: 60000 }, // 30 per minute
  credits: { maxRequests: 20, windowMs: 60000 }, // 20 per minute
  default: { maxRequests: 100, windowMs: 60000 }, // 100 per minute
};

export function getRateLimitKey(userId: string, endpoint: string): string {
  return `${userId}:${endpoint}`;
}

export function checkRateLimit(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const bucket = rateLimitStore.get(key);

  if (!bucket || bucket.resetTime < now) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetIn: config.windowMs };
  }

  if (bucket.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetIn: bucket.resetTime - now };
  }

  bucket.count++;
  return { allowed: true, remaining: config.maxRequests - bucket.count, resetIn: bucket.resetTime - now };
}

export function getLimit(endpoint: string): RateLimitConfig {
  return defaultLimits[endpoint] || defaultLimits.default;
}
