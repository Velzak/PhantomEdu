import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, assertSameOrigin } from "@/lib/http";

type Ctx = { params: { id: string } };

export async function POST(req: NextRequest, { params }: Ctx) {
  const originError = assertSameOrigin(req);
  if (originError) return originError;

  const game = await prisma.game.findUnique({ where: { id: params.id } });
  if (!game || !game.published) return jsonError("Game not available", 404);

  const [, updated] = await prisma.$transaction([
    prisma.playEvent.create({ data: { gameId: game.id } }),
    prisma.game.update({
      where: { id: game.id },
      data: { playCount: { increment: 1 } },
      select: { playCount: true },
    }),
  ]);

  return NextResponse.json({ playCount: updated.playCount });
}
