import { prisma } from "@/lib/db";
import type { RateLimitResult } from "@/lib/rateLimit";

/**
 * Durable limiter backed by SQLite. Used on Node API routes (upload, reports, login authorize).
 */
export async function rateLimitDb(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const since = new Date(Date.now() - windowMs);
  const count = await prisma.rateLimitHit.count({
    where: { key, createdAt: { gte: since } },
  });
  if (count >= limit) {
    const oldest = await prisma.rateLimitHit.findFirst({
      where: { key, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
    });
    const retryAfterMs = oldest
      ? Math.max(0, oldest.createdAt.getTime() + windowMs - Date.now())
      : windowMs;
    return { success: false, remaining: 0, retryAfterMs };
  }
  await prisma.rateLimitHit.create({ data: { key } });
  if (Math.random() < 0.05) {
    await prisma.rateLimitHit.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - windowMs * 4) } },
    });
  }
  return { success: true, remaining: limit - count - 1, retryAfterMs: windowMs };
}
