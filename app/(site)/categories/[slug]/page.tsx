import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCategories, getTags, searchGames } from "@/lib/games";
import { FilterBar } from "@/components/game/FilterBar";
import { GameGrid } from "@/components/game/GameGrid";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = {
  params: { slug: string };
  searchParams: { tag?: string; sort?: string; q?: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await prisma.category.findUnique({ where: { slug: params.slug } });
  return { title: category?.name ?? "Category" };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const category = await prisma.category.findUnique({ where: { slug: params.slug } });
  if (!category) notFound();

  const sort = searchParams.sort ?? "popular";
  const [result, categories, tags] = await Promise.all([
    searchGames({
      q: searchParams.q ?? "",
      category: category.slug,
      tag: searchParams.tag ?? "",
      sort,
      page: 1,
      pageSize: 24,
      publishedOnly: true,
    }),
    getCategories(),
    getTags(),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl">{category.name}</h1>
      <p className="mt-1 text-sm text-muted">{result.total} playable {result.total === 1 ? "game" : "games"}</p>
      <div className="mt-6">
        <FilterBar
          categories={categories}
          tags={tags}
          current={{ category: category.slug, tag: searchParams.tag, sort, q: searchParams.q }}
          basePath={`/categories/${category.slug}`}
        />
        <GameGrid
          initial={result.games}
          total={result.total}
          pageSize={24}
          query={{
            category: category.slug,
            tag: searchParams.tag ?? "",
            sort,
            q: searchParams.q ?? "",
          }}
        />
      </div>
    </div>
  );
}
