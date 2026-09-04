const memory = new Map<string, { count: number; resetAt: number }>();

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  retryAfterMs: number;
};

/**
 * Fast in-memory limiter (used from Edge middleware for login).
 * Process-local; a restart clears counters.
 */
export function rateLimitMemory(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const current = memory.get(key);
  if (!current || now >= current.resetAt) {
    memory.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, retryAfterMs: windowMs };
  }
  if (current.count >= limit) {
    return {
      success: false,
      remaining: 0,
      retryAfterMs: Math.max(0, current.resetAt - now),
    };
  }
  current.count += 1;
  return {
    success: true,
    remaining: limit - current.count,
    retryAfterMs: current.resetAt - now,
  };
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}
