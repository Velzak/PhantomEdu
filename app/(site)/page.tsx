import { getCategories, getFeaturedGame, getRecentGames, getTrendingGames, toCardDTO, gameCardInclude } from "@/lib/games";
import { prisma } from "@/lib/db";
import { HeroFeatured } from "@/components/home/HeroFeatured";
import { GameRail } from "@/components/game/GameRail";
import { CategoryChips } from "@/components/home/CategoryChips";
import { ContinuePlayingRail, FavoritesRail, RecommendedRail } from "@/components/home/LocalRails";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, trending, recent, categories, catalogRows] = await Promise.all([
    getFeaturedGame(),
    getTrendingGames(),
    getRecentGames(),
    getCategories(),
    prisma.game.findMany({
      where: { published: true },
      include: gameCardInclude,
      orderBy: { playCount: "desc" },
      take: 240,
    }),
  ]);

  if (!featured) {
    return (
      <EmptyState
        title="Nothing to play yet"
        body="No published games yet. Once an admin adds one, it will show up here ready to play."
      />
    );
  }

  const catalog = catalogRows.map(toCardDTO);

  return (
    <div>
      <HeroFeatured game={toCardDTO(featured)} />
      <GameRail title="Trending now" games={trending} trending />
      <ContinuePlayingRail catalog={catalog} />
      <CategoryChips
        categories={categories.map((c) => ({
          name: c.name,
          slug: c.slug,
          count: c._count.games,
        }))}
      />
      <div className="grid gap-8 lg:grid-cols-2">
        <GameRail title="Recently added" games={recent} />
        <RecommendedRail catalog={catalog} />
      </div>
      <FavoritesRail catalog={catalog} />
    </div>
  );
}
