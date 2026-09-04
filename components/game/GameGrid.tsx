"use client";

import { useEffect, useRef, useState } from "react";
import { GameCard } from "@/components/game/GameCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { GridSkeleton } from "@/components/ui/Skeleton";
import type { GameCardDTO } from "@/lib/gameView";
import { useToast } from "@/components/layout/ToastProvider";

type Props = {
  initial: GameCardDTO[];
  total: number;
  pageSize: number;
  query: Record<string, string>;
};

export function GameGrid({ initial, total, pageSize, query }: Props) {
  const [games, setGames] = useState(initial);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const sentinel = useRef<HTMLDivElement>(null);
  const hasMore = games.length < total;

  useEffect(() => {
    setGames(initial);
    setPage(1);
  }, [initial]);

  async function loadMore() {
    if (loading || !hasMore) return;
    setLoading(true);
    const nextPage = page + 1;
    const params = new URLSearchParams({ ...query, page: String(nextPage), pageSize: String(pageSize) });
    try {
      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) throw new Error("Could not load more games");
      const data = await res.json();
      setGames((current) => [...current, ...(data.games as GameCardDTO[])]);
      setPage(nextPage);
    } catch (err) {
      toast.push(err instanceof Error ? err.message : "Network failure", {
        actionLabel: "Retry",
        onAction: () => void loadMore(),
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) void loadMore();
    }, { rootMargin: "400px" });
    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, hasMore, loading, query]);

  if (games.length === 0) {
    return (
      <EmptyState
        title="No games match this search"
        body="Nothing in the catalog fits those words and filters. Clear them and browse the full list, or try a shorter title."
      />
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {games.map((game) => (
          <GameCard key={game.id} game={game} className="w-full" />
        ))}
      </div>
      {loading ? <div className="mt-6"><GridSkeleton count={6} /></div> : null}
      {hasMore ? (
        <div ref={sentinel} className="mt-6 flex justify-center">
          <Button type="button" variant="secondary" onClick={() => void loadMore()} disabled={loading}>
            {loading ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
