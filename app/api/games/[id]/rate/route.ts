import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, assertSameOrigin } from "@/lib/http";
import { rateSchema } from "@/lib/validation";
import { env } from "@/lib/env";

type Ctx = { params: { id: string } };

export async function POST(req: NextRequest, { params }: Ctx) {
  if (!env().ratingsEnabled) return jsonError("Ratings are disabled", 403);
  const originError = assertSameOrigin(req);
  if (originError) return originError;

  const body = await req.json().catch(() => null);
  const parsed = rateSchema.safeParse(body);
  if (!parsed.success) return jsonError("Rating must be 1–5", 400);

  const game = await prisma.game.findUnique({ where: { id: params.id } });
  if (!game || !game.published) return jsonError("Game not available", 404);

  const updated = await prisma.game.update({
    where: { id: game.id },
    data: {
      ratingSum: { increment: parsed.data.value },
      ratingCount: { increment: 1 },
    },
    select: { ratingSum: true, ratingCount: true },
  });

  return NextResponse.json({
    ratingSum: updated.ratingSum,
    ratingCount: updated.ratingCount,
  });
}
