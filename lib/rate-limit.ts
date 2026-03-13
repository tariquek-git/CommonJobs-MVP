// Simple in-memory rate limiter for serverless functions
// Uses a sliding window approach per IP

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // per window

// Clean up stale entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 60 * 1000);

export function getClientIP(request: Request | { headers: Record<string, string | string[] | undefined> }): string {
  // Support both Web API Request (headers.get) and Node/Vercel IncomingMessage (headers object)
  const getHeader = (name: string): string | undefined => {
    if ('get' in request.headers && typeof request.headers.get === 'function') {
      return request.headers.get(name) ?? undefined;
    }
    const val = (request.headers as Record<string, string | string[] | undefined>)[name];
    return Array.isArray(val) ? val[0] : val;
  };

  const realIP = getHeader('x-real-ip');
  if (realIP) return realIP;

  const forwarded = getHeader('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  return 'unknown';
}

export function checkRateLimit(ip: string, limit = MAX_REQUESTS, windowMs = WINDOW_MS): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const key = `rl:${ip}`;

  let entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    store.set(key, entry);
  }

  entry.count++;

  return {
    allowed: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  };
}
