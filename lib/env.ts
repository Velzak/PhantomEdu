import path from "path";
import "server-only";
import { prepareVercelFs } from "@/lib/prepareVercelFs";

prepareVercelFs();

if (!process.env.NEXTAUTH_URL && process.env.VERCEL_URL) {
  process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function env() {
  return {
    databaseUrl: required("DATABASE_URL"),
    nextAuthSecret: required("NEXTAUTH_SECRET"),
    nextAuthUrl:
      process.env.NEXTAUTH_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
    gamesStoragePath: process.env.GAMES_STORAGE_PATH ?? "./data/games",
    thumbnailsStoragePath:
      process.env.THUMBNAILS_STORAGE_PATH ?? "./data/uploads/thumbnails",
    maxUploadSizeMb: Number(process.env.MAX_UPLOAD_SIZE_MB ?? "15"),
    ratingsEnabled: process.env.FEATURE_RATINGS_ENABLED !== "false",
    gamesBaseUrl: process.env.GAMES_BASE_URL?.replace(/\/$/, "") ?? "",
  };
}

export function resolveDataPath(p: string) {
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

export function gameEntryUrl(entryPath: string) {
  const base = env().gamesBaseUrl;
  const cleaned = entryPath.replace(/^\/+/, "");
  return `${base}/games-content/${cleaned}`;
}

export function publicThumbnailUrl(filename: string) {
  const base = env().gamesBaseUrl;
  return `${base}/uploads/thumbnails/${filename}`;
}
