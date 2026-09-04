import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminResponse, assertSameOrigin, jsonError } from "@/lib/http";
import { gamePatchSchema } from "@/lib/validation";
import { gameCardInclude, toCardDTO } from "@/lib/games";
import {
  deleteGameFiles,
  deleteThumbnail,
  looksLikeHtml,
  maxUploadBytes,
  renameGameDir,
  saveGameHtml,
  saveThumbnail,
  selfContainedHtmlError,
} from "@/lib/storage";
import { env } from "@/lib/env";

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { error } = await requireAdminResponse();
  if (error) return error;
  const game = await prisma.game.findUnique({
    where: { id: params.id },
    include: gameCardInclude,
  });
  if (!game) return jsonError("Game not found", 404);
  return NextResponse.json(toCardDTO(game));
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const originError = assertSameOrigin(req);
  if (originError) return originError;
  const { error } = await requireAdminResponse();
  if (error) return error;

  const game = await prisma.game.findUnique({ where: { id: params.id } });
  if (!game) return jsonError("Game not found", 404);

  const contentType = req.headers.get("content-type") || "";
  let patch: Record<string, unknown> = {};
  let gameFile: File | null = null;
  let thumb: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const rawTags = form.get("tagIds");
    patch = {
      title: form.get("title") ?? undefined,
      slug: form.get("slug") ?? undefined,
      description: form.get("description") ?? undefined,
      categoryId: form.get("categoryId") ?? undefined,
      controls: emptyToNull(form.get("controls")),
      developer: emptyToNull(form.get("developer")),
      releaseDate: emptyToNull(form.get("releaseDate")),
    };
    if (form.has("featured")) patch.featured = form.get("featured") === "true";
    if (form.has("published")) patch.published = form.get("published") === "true";
    if (typeof rawTags === "string") {
      patch.tagIds = rawTags ? rawTags.split(",").filter(Boolean) : [];
    }
    const gf = form.get("gameFile");
    if (gf instanceof File && gf.size > 0) gameFile = gf;
    const th = form.get("thumbnail");
    if (th instanceof File && th.size > 0) thumb = th;
  } else {
    patch = await req.json();
  }

  const parsed = gamePatchSchema.safeParse(patch);
  if (!parsed.success) {
    return jsonError("Invalid game data", 400, { details: parsed.error.flatten() });
  }

  const data = parsed.data;
  let entryPath = game.entryPath;
  let thumbnailUrl = game.thumbnailUrl;
  let slug = game.slug;

  if (data.slug && data.slug !== game.slug) {
    const clash = await prisma.game.findUnique({ where: { slug: data.slug } });
    if (clash) return jsonError("That slug is already in use", 409);
    entryPath = await renameGameDir(game.slug, data.slug);
    slug = data.slug;
  }

  if (gameFile) {
    if (gameFile.size > maxUploadBytes()) {
      return jsonError(`Game file must be under ${env().maxUploadSizeMb}MB`, 400);
    }
    const buffer = Buffer.from(await gameFile.arrayBuffer());
    if (!looksLikeHtml(buffer, gameFile.name)) {
      return jsonError("Game file must be a valid HTML document", 400);
    }
    const containedError = selfContainedHtmlError(buffer);
    if (containedError) return jsonError(containedError, 400);
    entryPath = await saveGameHtml(slug, buffer);
  }

  if (thumb) {
    if (thumb.size > maxUploadBytes()) return jsonError("Thumbnail is too large", 400);
    const tbuf = Buffer.from(await thumb.arrayBuffer());
    thumbnailUrl = await saveThumbnail(slug, tbuf);
  }

  const releaseDate =
    data.releaseDate === undefined
      ? undefined
      : data.releaseDate
        ? parseReleaseDate(data.releaseDate)
        : null;

  const updated = await prisma.game.update({
    where: { id: game.id },
    data: {
      title: data.title,
      slug,
      description: data.description,
      categoryId: data.categoryId,
      controls: data.controls,
      developer: data.developer,
      releaseDate,
      featured: data.featured,
      published: data.published,
      entryPath,
      thumbnailUrl,
      sourceType: "html_upload",
      ...(data.tagIds
        ? {
            tags: {
              deleteMany: {},
              create: data.tagIds.map((tagId) => ({ tagId })),
            },
          }
        : {}),
    },
    include: gameCardInclude,
  });

  return NextResponse.json(toCardDTO(updated));
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const originError = assertSameOrigin(req);
  if (originError) return originError;
  const { error } = await requireAdminResponse();
  if (error) return error;

  const game = await prisma.game.findUnique({ where: { id: params.id } });
  if (!game) return jsonError("Game not found", 404);

  await prisma.game.delete({ where: { id: game.id } });
  await deleteGameFiles(game.slug);
  await deleteThumbnail(game.thumbnailUrl);
  return NextResponse.json({ ok: true });
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
