import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireAdminResponse, assertSameOrigin } from "@/lib/http";

type Ctx = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const originError = assertSameOrigin(req);
  if (originError) return originError;
  const { error } = await requireAdminResponse();
  if (error) return error;

  const body = (await req.json().catch(() => null)) as { resolved?: boolean } | null;
  const report = await prisma.report.findUnique({ where: { id: params.id } });
  if (!report) return jsonError("Report not found", 404);

  const updated = await prisma.report.update({
    where: { id: report.id },
    data: { resolved: body?.resolved !== false },
  });
  return NextResponse.json(updated);
}
