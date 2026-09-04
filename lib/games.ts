import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { GameCardDTO } from "@/lib/gameView";

export type { GameCardDTO } from "@/lib/gameView";
export { averageRating, isNewGame, recommendFromLocal } from "@/lib/gameView";

export const gameCardInclude = {
  category: { select: { id: true, name: true, slug: true } },
  tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
} satisfies Prisma.GameInclude;

export type GameWithRelations = Prisma.GameGetPayload<{ include: typeof gameCardInclude }>;

export function toCardDTO(game: GameWithRelations): GameCardDTO {
  return {
    id: game.id,
    slug: game.slug,
    title: game.title,
    description: game.description,
    thumbnailUrl: game.thumbnailUrl,
    category: game.category,
    tags: game.tags.map((t) => t.tag),
    playCount: game.playCount,
    ratingSum: game.ratingSum,
    ratingCount: game.ratingCount,
    featured: game.featured,
    published: game.published,
    createdAt: game.createdAt.toISOString(),
    developer: game.developer,
    controls: game.controls,
    releaseDate: game.releaseDate ? game.releaseDate.toISOString() : null,
    entryPath: game.entryPath,
    sourceType: game.sourceType,
  };
}

const publishedWhere: Prisma.GameWhereInput = { published: true };

export async function getPublishedGameBySlug(slug: string) {
  return prisma.game.findUnique({
    where: { slug },
    include: gameCardInclude,
  });
}

export async function getFeaturedGame() {
  const featured = await prisma.game.findFirst({
    where: { ...publishedWhere, featured: true },
    include: gameCardInclude,
    orderBy: { updatedAt: "desc" },
  });
  if (featured) return featured;
  return prisma.game.findFirst({
    where: publishedWhere,
    include: gameCardInclude,
    orderBy: { playCount: "desc" },
  });
}

export async function getTrendingGames(limit = 12) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const grouped = await prisma.playEvent.groupBy({
    by: ["gameId"],
    where: { playedAt: { gte: since }, game: publishedWhere },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });
  if (grouped.length === 0) {
    const fallback = await prisma.game.findMany({
      where: publishedWhere,
      include: gameCardInclude,
      orderBy: { playCount: "desc" },
      take: limit,
    });
    return fallback.map(toCardDTO);
  }
  const games = await prisma.game.findMany({
    where: { id: { in: grouped.map((g) => g.gameId) }, published: true },
    include: gameCardInclude,
  });
  const order = new Map(grouped.map((g, i) => [g.gameId, i]));
  return games
    .sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99))
    .map(toCardDTO);
}

export async function getRecentGames(limit = 12) {
  const games = await prisma.game.findMany({
    where: publishedWhere,
    include: gameCardInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return games.map(toCardDTO);
}

export async function getRelatedGames(game: GameWithRelations, limit = 8) {
  const tagIds = game.tags.map((t) => t.tagId);
  const related = await prisma.game.findMany({
    where: {
      published: true,
      id: { not: game.id },
      OR: [
        { categoryId: game.categoryId },
        tagIds.length ? { tags: { some: { tagId: { in: tagIds } } } } : undefined,
      ].filter(Boolean) as Prisma.GameWhereInput[],
    },
    include: gameCardInclude,
    take: limit,
    orderBy: { playCount: "desc" },
  });
  return related.map(toCardDTO);
}

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { games: { where: publishedWhere } } } },
  });
}

export async function getTags() {
  return prisma.tag.findMany({ orderBy: { name: "asc" } });
}

export function searchWhere(opts: {
  q: string;
  category: string;
  tag: string;
  publishedOnly: boolean;
}): Prisma.GameWhereInput {
  const where: Prisma.GameWhereInput = {};
  if (opts.publishedOnly) where.published = true;
  if (opts.category) where.category = { slug: opts.category };
  if (opts.tag) where.tags = { some: { tag: { slug: opts.tag } } };
  if (opts.q) {
    where.OR = [
      { title: { contains: opts.q } },
      { description: { contains: opts.q } },
      { developer: { contains: opts.q } },
      { category: { name: { contains: opts.q } } },
      { tags: { some: { tag: { name: { contains: opts.q } } } } },
    ];
  }
  return where;
}

export function sortToOrder(sort: string): Prisma.GameOrderByWithRelationInput[] {
  switch (sort) {
    case "newest":
      return [{ createdAt: "desc" }];
    case "alphabetical":
      return [{ title: "asc" }];
    case "rating":
      return [{ ratingCount: "desc" }, { ratingSum: "desc" }];
    case "popular":
    default:
      return [{ playCount: "desc" }, { createdAt: "desc" }];
  }
}

export async function searchGames(opts: {
  q: string;
  category: string;
  tag: string;
  sort: string;
  page: number;
  pageSize: number;
  publishedOnly: boolean;
  slugs?: string[];
}) {
  const where = searchWhere(opts);
  if (opts.slugs?.length) {
    where.slug = { in: opts.slugs };
  }
  const [total, games] = await Promise.all([
    prisma.game.count({ where }),
    prisma.game.findMany({
      where,
      include: gameCardInclude,
      orderBy: sortToOrder(opts.sort),
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
    }),
  ]);
  return {
    total,
    page: opts.page,
    pageSize: opts.pageSize,
    pages: Math.max(1, Math.ceil(total / opts.pageSize)),
    games: games.map(toCardDTO),
  };
}
