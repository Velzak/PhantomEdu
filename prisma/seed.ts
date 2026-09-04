import { promises as fs } from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES = [
  "Action",
  "Adventure",
  "Arcade",
  "Puzzle",
  "Racing",
  "Sports",
  "Strategy",
  "Multiplayer",
  "2 Player",
  "Casual",
  "Platformer",
  "Simulation",
  "Other",
];

const TAGS = ["single-file", "keyboard", "reflex", "classic", "short-session"];

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function gamesRoot() {
  const configured = process.env.GAMES_STORAGE_PATH || "./data/games";
  return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
}

async function upsertCategory(name: string) {
  const slug = slugify(name);
  return prisma.category.upsert({
    where: { slug },
    update: { name },
    create: { name, slug },
  });
}

async function upsertTag(name: string) {
  const slug = slugify(name);
  return prisma.tag.upsert({
    where: { slug },
    update: { name },
    create: { name, slug },
  });
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set before seeding.");
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash },
  });
}

type SeedGame = {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  controls: string;
  developer: string;
  featured: boolean;
  fixture: string;
};

const GAMES: SeedGame[] = [
  {
    slug: "ribbon",
    title: "Ribbon",
    description:
      "Steer a growing ribbon across a tight court. Eat every glint you can reach, and end the run the moment you hit a wall or fold into yourself.",
    category: "Arcade",
    tags: ["classic", "keyboard", "short-session"],
    controls: "Arrow keys or WASD",
    developer: "Phantom",
    featured: true,
    fixture: "ribbon.html",
  },
  {
    slug: "baseline",
    title: "Baseline",
    description:
      "Hold the left paddle and rally against a patient machine. First to seven points takes the match.",
    category: "Sports",
    tags: ["classic", "keyboard", "single-file"],
    controls: "W/S or arrows; pointer also moves the paddle",
    developer: "Phantom",
    featured: false,
    fixture: "baseline.html",
  },
  {
    slug: "kiln",
    title: "Kiln",
    description:
      "Bounce an ember through a wall of kiln bricks. Clear the grid to win, and keep the ember off the floor.",
    category: "Arcade",
    tags: ["classic", "keyboard", "short-session"],
    controls: "Arrows or A/D; pointer also moves the paddle",
    developer: "Phantom",
    featured: false,
    fixture: "kiln.html",
  },
  {
    slug: "ledge",
    title: "Ledge",
    description:
      "A short platform hop to a teal beacon. Cross the gaps, jump the crates, and stay on the stone.",
    category: "Platformer",
    tags: ["keyboard", "short-session"],
    controls: "Arrows or WASD to move, Space or Up to jump",
    developer: "Phantom",
    featured: false,
    fixture: "ledge.html",
  },
  {
    slug: "flashpoint",
    title: "Flashpoint",
    description:
      "Wait for the pad to turn teal, then click. The trial records your reaction time and keeps a session best.",
    category: "Casual",
    tags: ["reflex", "short-session"],
    controls: "Click or tap the pad; Space also works",
    developer: "Phantom",
    featured: false,
    fixture: "flashpoint.html",
  },
];

async function seedGames(categories: Record<string, { id: string }>, tags: Record<string, { id: string }>) {
  const root = gamesRoot();
  const fixtures = path.join(process.cwd(), "prisma", "fixtures");
  await fs.mkdir(root, { recursive: true });

  for (const game of GAMES) {
    const html = await fs.readFile(path.join(fixtures, game.fixture), "utf8");
    const dir = path.join(root, game.slug);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "index.html"), html, "utf8");
    const entryPath = `${game.slug}/index.html`;
    const categoryId = categories[game.category].id;

    const existing = await prisma.game.findUnique({ where: { slug: game.slug } });
    const data = {
      title: game.title,
      description: game.description,
      categoryId,
      controls: game.controls,
      developer: game.developer,
      featured: game.featured,
      published: true,
      sourceType: "html_upload",
      entryPath,
      releaseDate: new Date("2026-09-01T00:00:00.000Z"),
    };

    const row = existing
      ? await prisma.game.update({
          where: { slug: game.slug },
          data: {
            ...data,
            tags: { deleteMany: {}, create: game.tags.map((name) => ({ tagId: tags[name].id })) },
          },
        })
      : await prisma.game.create({
          data: {
            slug: game.slug,
            ...data,
            tags: { create: game.tags.map((name) => ({ tagId: tags[name].id })) },
          },
        });
    void row;
  }
}

async function main() {
  const categoryRows = await Promise.all(CATEGORIES.map(upsertCategory));
  const tagRows = await Promise.all(TAGS.map(upsertTag));
  const categories = Object.fromEntries(categoryRows.map((c) => [c.name, c]));
  const tags = Object.fromEntries(tagRows.map((t) => [t.name, t]));
  await seedAdmin();
  await seedGames(categories, tags);
  console.log("Seed complete: categories, tags, admin, and five playable games.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
