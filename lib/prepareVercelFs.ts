import { copyFileSync, cpSync, existsSync, mkdirSync } from "fs";
import path from "path";
import "server-only";

let prepared = false;

const SEED_SLUGS = ["ribbon", "baseline", "kiln", "ledge", "flashpoint"] as const;

function isNextBuildPhase() {
  const phase = process.env.NEXT_PHASE;
  return (
    phase === "phase-production-build" ||
    phase === "phase-production-compile" ||
    phase === "phase-export"
  );
}

/**
 * Vercel's filesystem is read-only except /tmp. Copy the build-time SQLite
 * file and seed games into /tmp so Prisma and the game player can write.
 * Writes do not survive cold starts — this is a serverless demo constraint.
 *
 * Must not run during `next build` (page data collection) or on a developer
 * machine: `vercel deploy` sets VERCEL=1 locally, and /tmp is not the Lambda FS.
 */
export function prepareVercelFs() {
  if (prepared || !process.env.VERCEL || isNextBuildPhase()) return;
  if (process.platform !== "linux") return;
  prepared = true;

  const cwd = process.cwd();
  const tmpDb = "/tmp/db.sqlite";
  mkdirSync("/tmp", { recursive: true });

  const srcDbCandidates = [
    path.join(cwd, "data", "db.sqlite"),
    path.join(cwd, "prisma", ".vercel-seed.sqlite"),
  ];
  if (!existsSync(tmpDb)) {
    const srcDb = srcDbCandidates.find((candidate) => existsSync(candidate));
    if (srcDb) copyFileSync(srcDb, tmpDb);
  }

  const tmpGames = "/tmp/games";
  mkdirSync(tmpGames, { recursive: true });
  const srcGames = path.join(cwd, "data", "games");
  if (existsSync(srcGames)) {
    cpSync(srcGames, tmpGames, { recursive: true });
  } else {
    const fixtures = path.join(cwd, "prisma", "fixtures");
    for (const slug of SEED_SLUGS) {
      const src = path.join(fixtures, `${slug}.html`);
      const destDir = path.join(tmpGames, slug);
      mkdirSync(destDir, { recursive: true });
      if (existsSync(src) && !existsSync(path.join(destDir, "index.html"))) {
        copyFileSync(src, path.join(destDir, "index.html"));
      }
    }
  }

  mkdirSync("/tmp/uploads/thumbnails", { recursive: true });

  process.env.DATABASE_URL = "file:/tmp/db.sqlite";
  process.env.GAMES_STORAGE_PATH = "/tmp/games";
  process.env.THUMBNAILS_STORAGE_PATH = "/tmp/uploads/thumbnails";
}
