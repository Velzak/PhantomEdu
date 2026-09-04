import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireAdminResponse, assertSameOrigin } from "@/lib/http";
import { tagWriteSchema, slugify } from "@/lib/validation";

type Ctx = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const originError = assertSameOrigin(req);
  if (originError) return originError;
  const { error } = await requireAdminResponse();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = tagWriteSchema.partial().safeParse(body);
  if (!parsed.success) return jsonError("Invalid tag", 400);

  const existing = await prisma.tag.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError("Tag not found", 404);

  const name = parsed.data.name ?? existing.name;
  const slug = parsed.data.slug || (parsed.data.name ? slugify(parsed.data.name) : existing.slug);
  const tag = await prisma.tag.update({
    where: { id: params.id },
    data: { name, slug },
  });
  return NextResponse.json(tag);
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const originError = assertSameOrigin(req);
  if (originError) return originError;
  const { error } = await requireAdminResponse();
  if (error) return error;

  await prisma.tag.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
