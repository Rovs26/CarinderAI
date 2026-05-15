const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 5;

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

export function getClientIp(forwardedFor: string | null, realIp: string | null): string {
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  if (realIp) return realIp;
  return "unknown";
}

export function checkExtractRateLimit(ip: string): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now >= entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count += 1;
  return { allowed: true };
}
