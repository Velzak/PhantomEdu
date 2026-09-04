import { promises as fs } from "fs";
import path from "path";
import { env, resolveDataPath } from "@/lib/env";
import { prepareVercelFs } from "@/lib/prepareVercelFs";

prepareVercelFs();

const HTML_MAX_SNIFF = 512;

function gamesRoot() {
  return resolveDataPath(env().gamesStoragePath);
}

function thumbsRoot() {
  return resolveDataPath(env().thumbnailsStoragePath);
}

export function assertSafeSegment(segment: string) {
  if (!segment || segment.includes("..") || segment.includes("/") || segment.includes("\\")) {
    throw new Error("Invalid path segment");
  }
}

export function assertContained(root: string, target: string) {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(target);
  if (resolvedTarget !== resolvedRoot && !resolvedTarget.startsWith(resolvedRoot + path.sep)) {
    throw new Error("Path escapes storage root");
  }
}

export async function ensureStorageDirs() {
  await fs.mkdir(gamesRoot(), { recursive: true });
  await fs.mkdir(thumbsRoot(), { recursive: true });
}

export function looksLikeHtml(buffer: Buffer, filename: string) {
  const ext = path.extname(filename).toLowerCase();
  if (ext !== ".html" && ext !== ".htm") return false;
  const head = buffer.subarray(0, HTML_MAX_SNIFF).toString("utf8").trimStart().toLowerCase();
  return (
    head.startsWith("<!doctype html") ||
    head.startsWith("<html") ||
    head.includes("<html") ||
    (head.startsWith("<") && (head.includes("<canvas") || head.includes("<script") || head.includes("<body")))
  );
}

/** Phantom's player is a sandboxed iframe. Games that pull assets from another origin will not run. */
export function selfContainedHtmlError(buffer: Buffer): string | null {
  const sample = buffer.subarray(0, Math.min(buffer.length, 200_000)).toString("utf8");
  const base = sample.match(/<base\b[^>]*\bhref\s*=\s*["'](https?:\/\/[^"']+)/i);
  if (base) {
    return "This HTML file loads assets from another website. Phantom only accepts a single self-contained .html file with scripts and styles inline.";
  }
  return null;
}

export function sniffImageExt(buffer: Buffer): "png" | "jpg" | "webp" | "gif" | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return "png";
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg";
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return "gif";
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

export async function saveGameHtml(slug: string, buffer: Buffer) {
  assertSafeSegment(slug);
  const dir = path.join(gamesRoot(), slug);
  await fs.mkdir(dir, { recursive: true });
  const dest = path.join(dir, "index.html");
  assertContained(gamesRoot(), dest);
  await fs.writeFile(dest, buffer);
  return `${slug}/index.html`;
}

export async function saveThumbnail(slug: string, buffer: Buffer) {
  assertSafeSegment(slug);
  const ext = sniffImageExt(buffer);
  if (!ext) throw new Error("Unsupported image type");
  await fs.mkdir(thumbsRoot(), { recursive: true });
  const filename = `${slug}.${ext}`;
  const dest = path.join(thumbsRoot(), filename);
  assertContained(thumbsRoot(), dest);
  await fs.writeFile(dest, buffer);
  return `/uploads/thumbnails/${filename}`;
}

export async function deleteGameFiles(slug: string) {
  assertSafeSegment(slug);
  const dir = path.join(gamesRoot(), slug);
  assertContained(gamesRoot(), dir);
  await fs.rm(dir, { recursive: true, force: true });
}

export async function deleteThumbnail(thumbnailUrl: string | null | undefined) {
  if (!thumbnailUrl) return;
  const filename = path.basename(thumbnailUrl);
  if (!filename) return;
  const dest = path.join(thumbsRoot(), filename);
  try {
    assertContained(thumbsRoot(), dest);
    await fs.unlink(dest);
  } catch {
    // Missing file is fine
  }
}

export async function renameGameDir(oldSlug: string, newSlug: string) {
  if (oldSlug === newSlug) return `${newSlug}/index.html`;
  assertSafeSegment(oldSlug);
  assertSafeSegment(newSlug);
  const from = path.join(gamesRoot(), oldSlug);
  const to = path.join(gamesRoot(), newSlug);
  assertContained(gamesRoot(), from);
  assertContained(gamesRoot(), to);
  await fs.rm(to, { recursive: true, force: true });
  await fs.rename(from, to);
  return `${newSlug}/index.html`;
}

export function mimeForFilename(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".html":
    case ".htm":
      return "text/html; charset=utf-8";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
      return "text/javascript; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}

export function getGamesRoot() {
  return gamesRoot();
}

export function getThumbsRoot() {
  return thumbsRoot();
}

export function maxUploadBytes() {
  return env().maxUploadSizeMb * 1024 * 1024;
}
