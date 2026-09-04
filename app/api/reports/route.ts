import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireAdminResponse, assertSameOrigin } from "@/lib/http";
import { reportSchema } from "@/lib/validation";
import { clientIp } from "@/lib/rateLimit";
import { rateLimitDb } from "@/lib/rateLimitDb";

export async function GET() {
  const { error } = await requireAdminResponse();
  if (error) return error;
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    include: { game: { select: { id: true, title: true, slug: true } } },
  });
  return NextResponse.json({ reports });
}

export async function POST(req: NextRequest) {
  const originError = assertSameOrigin(req);
  if (originError) return originError;

  const limited = await rateLimitDb(`report:${clientIp(req)}`, 8, 10 * 60 * 1000);
  if (!limited.success) {
    return jsonError("Too many reports from this network. Try again later.", 429);
  }

  const body = await req.json().catch(() => null);
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) return jsonError("Please describe the problem (at least 8 characters).", 400);

  const game = await prisma.game.findUnique({ where: { id: parsed.data.gameId } });
  if (!game) return jsonError("Game not found", 404);

  const report = await prisma.report.create({
    data: { gameId: game.id, message: parsed.data.message },
  });
  return NextResponse.json({ id: report.id }, { status: 201 });
}
