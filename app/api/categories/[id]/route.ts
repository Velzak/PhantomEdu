import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireAdminResponse, assertSameOrigin } from "@/lib/http";
import { categoryWriteSchema, slugify } from "@/lib/validation";

type Ctx = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const originError = assertSameOrigin(req);
  if (originError) return originError;
  const { error } = await requireAdminResponse();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = categoryWriteSchema.partial().safeParse(body);
  if (!parsed.success) return jsonError("Invalid category", 400);

  const existing = await prisma.category.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError("Category not found", 404);

  const name = parsed.data.name ?? existing.name;
  const slug = parsed.data.slug || (parsed.data.name ? slugify(parsed.data.name) : existing.slug);
  const category = await prisma.category.update({
    where: { id: params.id },
    data: { name, slug },
  });
  return NextResponse.json(category);
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const originError = assertSameOrigin(req);
  if (originError) return originError;
  const { error } = await requireAdminResponse();
  if (error) return error;

  const count = await prisma.game.count({ where: { categoryId: params.id } });
  if (count > 0) {
    return jsonError("Move or delete games in this category first", 409);
  }
  await prisma.category.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
