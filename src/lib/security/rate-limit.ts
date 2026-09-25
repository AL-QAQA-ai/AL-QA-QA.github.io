interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const defaults: Record<string, RateLimitConfig> = {
  "chat": { windowMs: 60_000, maxRequests: 30 },
  "register": { windowMs: 300_000, maxRequests: 5 },
  "login": { windowMs: 300_000, maxRequests: 10 },
  "api": { windowMs: 60_000, maxRequests: 100 },
};

export function checkRateLimit(
  key: string,
  config?: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const cfg = config ?? defaults.api ?? { windowMs: 60_000, maxRequests: 100 };
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + cfg.windowMs });
    return { allowed: true, remaining: cfg.maxRequests - 1, resetAt: now + cfg.windowMs };
  }

  if (entry.count >= cfg.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: cfg.maxRequests - entry.count, resetAt: entry.resetAt };
}

export function getRateLimitConfig(purpose: string): RateLimitConfig {
  return defaults[purpose] ?? defaults.api;
}

// Cleanup old entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 300_000);
}
