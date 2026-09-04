import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminResponse, assertSameOrigin, jsonError } from "@/lib/http";
import { gameWriteSchema, searchQuerySchema } from "@/lib/validation";
import { gameCardInclude, searchGames, toCardDTO } from "@/lib/games";
import {
  looksLikeHtml,
  maxUploadBytes,
  saveGameHtml,
  saveThumbnail,
  ensureStorageDirs,
} from "@/lib/storage";
import { env } from "@/lib/env";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const parsed = searchQuerySchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    category: url.searchParams.get("category") ?? "",
    tag: url.searchParams.get("tag") ?? "",
    sort: url.searchParams.get("sort") ?? "popular",
    page: url.searchParams.get("page") ?? "1",
    pageSize: url.searchParams.get("pageSize") ?? "24",
    slugs: url.searchParams.get("slugs") ?? undefined,
  });
  if (!parsed.success) return jsonError("Invalid query", 400);

  const admin = url.searchParams.get("admin") === "1";
  let publishedOnly = true;
  if (admin) {
    const { error } = await requireAdminResponse();
    if (error) return error;
    publishedOnly = false;
  }

  const { slugs: slugParam, ...query } = parsed.data;
  const slugs = slugParam
    ? slugParam.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;

  const result = await searchGames({
    ...query,
    publishedOnly,
    slugs,
  });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const originError = assertSameOrigin(req);
  if (originError) return originError;
  const { error } = await requireAdminResponse();
  if (error) return error;

  await ensureStorageDirs();
  const form = await req.formData();
  const rawTags = form.get("tagIds");
  let tagIds: string[] = [];
  if (typeof rawTags === "string" && rawTags) {
    tagIds = rawTags.split(",").filter(Boolean);
  }

  const parsed = gameWriteSchema.safeParse({
    title: form.get("title"),
    slug: form.get("slug"),
    description: form.get("description"),
    categoryId: form.get("categoryId"),
    tagIds,
    controls: emptyToNull(form.get("controls")),
    developer: emptyToNull(form.get("developer")),
    releaseDate: emptyToNull(form.get("releaseDate")),
    featured: form.get("featured") === "true",
    published: form.get("published") === "true",
  });
  if (!parsed.success) {
    return jsonError("Invalid game data", 400, { details: parsed.error.flatten() });
  }

  const existing = await prisma.game.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return jsonError("That slug is already in use", 409);

  const gameFile = form.get("gameFile");
  if (!(gameFile instanceof File) || gameFile.size === 0) {
    return jsonError("An HTML game file is required", 400);
  }
  if (gameFile.size > maxUploadBytes()) {
    return jsonError(`Game file must be under ${env().maxUploadSizeMb}MB`, 400);
  }
  const buffer = Buffer.from(await gameFile.arrayBuffer());
  if (!looksLikeHtml(buffer, gameFile.name)) {
    return jsonError("Game file must be a valid HTML document", 400);
  }

  const entryPath = await saveGameHtml(parsed.data.slug, buffer);

  let thumbnailUrl: string | null = null;
  const thumb = form.get("thumbnail");
  if (thumb instanceof File && thumb.size > 0) {
    if (thumb.size > maxUploadBytes()) {
      return jsonError("Thumbnail is too large", 400);
    }
    const tbuf = Buffer.from(await thumb.arrayBuffer());
    thumbnailUrl = await saveThumbnail(parsed.data.slug, tbuf);
  }

  const releaseDate = parseReleaseDate(parsed.data.releaseDate);

  const game = await prisma.game.create({
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description,
      categoryId: parsed.data.categoryId,
      controls: parsed.data.controls,
      developer: parsed.data.developer,
      releaseDate,
      featured: parsed.data.featured,
      published: parsed.data.published,
      sourceType: "html_upload",
      entryPath,
      thumbnailUrl,
      tags: {
        create: parsed.data.tagIds.map((tagId) => ({ tagId })),
      },
    },
    include: gameCardInclude,
  });

  return NextResponse.json(toCardDTO(game), { status: 201 });
}

function emptyToNull(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function parseReleaseDate(value: string | null | undefined) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00.000Z`);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}
