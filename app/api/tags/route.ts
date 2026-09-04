import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireAdminResponse, assertSameOrigin } from "@/lib/http";
import { tagWriteSchema, slugify } from "@/lib/validation";

export async function GET() {
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ tags });
}

export async function POST(req: NextRequest) {
  const originError = assertSameOrigin(req);
  if (originError) return originError;
  const { error } = await requireAdminResponse();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = tagWriteSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid tag", 400);

  const slug = parsed.data.slug || slugify(parsed.data.name);
  const tag = await prisma.tag.create({ data: { name: parsed.data.name, slug } });
  return NextResponse.json(tag, { status: 201 });
}
