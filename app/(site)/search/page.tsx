import { getCategories, getTags, searchGames } from "@/lib/games";
import { FilterBar } from "@/components/game/FilterBar";
import { GameGrid } from "@/components/game/GameGrid";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Search" };

type Props = {
  searchParams: { q?: string; category?: string; tag?: string; sort?: string };
};

export default async function SearchPage({ searchParams }: Props) {
  const q = searchParams.q ?? "";
  const sort = searchParams.sort ?? "popular";
  const [result, categories, tags] = await Promise.all([
    searchGames({
      q,
      category: searchParams.category ?? "",
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
      <h1 className="font-display text-3xl">Search</h1>
      {q ? (
        <p className="mt-1 text-sm text-muted">
          {result.total} {result.total === 1 ? "result" : "results"} for “{q}”
        </p>
      ) : (
        <p className="mt-1 text-sm text-muted">Filter the full catalog.</p>
      )}
      <div className="mt-6">
        <FilterBar
          categories={categories}
          tags={tags}
          current={{ q, category: searchParams.category, tag: searchParams.tag, sort }}
          basePath="/search"
        />
        <GameGrid
          initial={result.games}
          total={result.total}
          pageSize={24}
          query={{
            q,
            category: searchParams.category ?? "",
            tag: searchParams.tag ?? "",
            sort,
          }}
        />
      </div>
    </div>
  );
}
