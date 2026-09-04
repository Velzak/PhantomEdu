import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireAdminResponse, assertSameOrigin } from "@/lib/http";
import { clientIp } from "@/lib/rateLimit";
import { rateLimitDb } from "@/lib/rateLimitDb";
import {
  ensureStorageDirs,
  looksLikeHtml,
  maxUploadBytes,
  saveGameHtml,
  saveThumbnail,
  sniffImageExt,
  selfContainedHtmlError,
} from "@/lib/storage";
import { env } from "@/lib/env";
import { slugSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const originError = assertSameOrigin(req);
  if (originError) return originError;
  const { error } = await requireAdminResponse();
  if (error) return error;

  const limited = await rateLimitDb(`upload:${clientIp(req)}`, 20, 10 * 60 * 1000);
  if (!limited.success) {
    return jsonError("Upload rate limit reached. Try again in a few minutes.", 429);
  }

  await ensureStorageDirs();
  const form = await req.formData();
  const kind = String(form.get("kind") || "");
  const slugResult = slugSchema.safeParse(String(form.get("slug") || ""));
  if (!slugResult.success) return jsonError("A valid slug is required", 400);
  const slug = slugResult.data;
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return jsonError("A file is required", 400);
  if (file.size > maxUploadBytes()) {
    return jsonError(`File must be under ${env().maxUploadSizeMb}MB`, 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (kind === "game") {
    if (!looksLikeHtml(buffer, file.name)) {
      return jsonError("Game file must be a valid HTML document", 400);
    }
    const containedError = selfContainedHtmlError(buffer);
    if (containedError) return jsonError(containedError, 400);
    const entryPath = await saveGameHtml(slug, buffer);
    return NextResponse.json({ entryPath, url: `/games-content/${entryPath}` });
  }

  if (kind === "thumbnail") {
    if (!sniffImageExt(buffer)) {
      return jsonError("Thumbnail must be a PNG, JPEG, WEBP, or GIF image", 400);
    }
    const thumbnailUrl = await saveThumbnail(slug, buffer);
    return NextResponse.json({ thumbnailUrl });
  }

  return jsonError("Unknown upload kind", 400);
}
