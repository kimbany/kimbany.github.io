import "server-only";

/**
 * Lightweight per-key rate limiter (fixed window). In-memory per warm instance
 * — enough to keep beta gentle and protect the OpenAI budget. For scale, swap
 * the store for Upstash/Redis behind the same interface.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export interface RateResult {
  ok: boolean;
  remaining: number;
  retryAfter: number; // seconds
}

export function rateLimit(key: string, limit = 20, windowMs = 60_000): RateResult {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }
  if (b.count >= limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count += 1;
  return { ok: true, remaining: limit - b.count, retryAfter: 0 };
}

/** Derive a stable key from a uid (preferred) or the request IP. */
export function rateKey(req: Request, uid?: string | null): string {
  if (uid) return `uid:${uid}`;
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0]?.trim() || "anon";
  return `ip:${ip}`;
}
