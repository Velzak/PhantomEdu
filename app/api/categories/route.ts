import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireAdminResponse, assertSameOrigin } from "@/lib/http";
import { categoryWriteSchema, slugify } from "@/lib/validation";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { games: true } } },
  });
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const originError = assertSameOrigin(req);
  if (originError) return originError;
  const { error } = await requireAdminResponse();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = categoryWriteSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid category", 400);

  const slug = parsed.data.slug || slugify(parsed.data.name);
  const category = await prisma.category.create({
    data: { name: parsed.data.name, slug },
  });
  return NextResponse.json(category, { status: 201 });
}
