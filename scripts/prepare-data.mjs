import { copyFileSync, existsSync, mkdirSync } from "fs";
import { spawnSync } from "child_process";
import path from "path";

function run(cmd, args, extraEnv = {}) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
    shell: true,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (process.env.VERCEL) {
  mkdirSync(path.join(process.cwd(), "data", "games"), { recursive: true });
  mkdirSync(path.join(process.cwd(), "data", "uploads", "thumbnails"), { recursive: true });

  const buildEnv = {
    DATABASE_URL: "file:../data/db.sqlite",
    GAMES_STORAGE_PATH: "./data/games",
    THUMBNAILS_STORAGE_PATH: "./data/uploads/thumbnails",
  };

  run("npx", ["prisma", "migrate", "deploy"], buildEnv);
  run("npx", ["tsx", "prisma/seed.ts"], buildEnv);

  const seededDb = path.join(process.cwd(), "data", "db.sqlite");
  const tracedDb = path.join(process.cwd(), "prisma", ".vercel-seed.sqlite");
  if (existsSync(seededDb)) {
    copyFileSync(seededDb, tracedDb);
  }

  run("npx", ["next", "build"], buildEnv);
} else {
  run("npx", ["next", "build"]);
}
