export type GameCardDTO = {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  category: { id: string; name: string; slug: string };
  tags: { id: string; name: string; slug: string }[];
  playCount: number;
  ratingSum: number;
  ratingCount: number;
  featured: boolean;
  published: boolean;
  createdAt: string;
  developer: string | null;
  controls: string | null;
  releaseDate: string | null;
  entryPath: string;
  sourceType: string;
};

export function averageRating(sum: number, count: number) {
  if (count <= 0) return 0;
  return Math.round((sum / count) * 10) / 10;
}

export function isNewGame(createdAt: string | Date) {
  const created = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  return Date.now() - created.getTime() < 7 * 24 * 60 * 60 * 1000;
}

export function recommendFromLocal(
  catalog: GameCardDTO[],
  signalSlugs: string[],
  exclude: Set<string>,
  limit = 12
) {
  const signals = catalog.filter((g) => signalSlugs.includes(g.slug));
  if (signals.length === 0) return [];
  const categoryIds = new Set(signals.map((g) => g.category.id));
  const tagIds = new Set(signals.flatMap((g) => g.tags.map((t) => t.id)));
  return catalog
    .filter((g) => !exclude.has(g.slug) && !signalSlugs.includes(g.slug))
    .map((g) => {
      let score = 0;
      if (categoryIds.has(g.category.id)) score += 3;
      score += g.tags.filter((t) => tagIds.has(t.id)).length;
      return { game: g, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.game.playCount - a.game.playCount)
    .slice(0, limit)
    .map((x) => x.game);
}
