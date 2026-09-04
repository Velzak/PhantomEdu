"use client";

import { useEffect, useState } from "react";
import { GameRail } from "@/components/game/GameRail";
import { loadPrefs } from "@/lib/localPrefs";
import { recommendFromLocal, type GameCardDTO } from "@/lib/gameView";

function useLocalCatalog(catalog: GameCardDTO[]) {
  const [ready, setReady] = useState(false);
  const [continuePlaying, setContinuePlaying] = useState<GameCardDTO[]>([]);
  const [favorites, setFavorites] = useState<GameCardDTO[]>([]);
  const [recommended, setRecommended] = useState<GameCardDTO[]>([]);

  useEffect(() => {
    const prefs = loadPrefs();
    const bySlug = new Map(catalog.map((g) => [g.slug, g]));
    const recents = prefs.recentlyPlayed
      .map((item) => bySlug.get(item.slug))
      .filter((g): g is GameCardDTO => Boolean(g));
    const favs = prefs.favorites.map((slug) => bySlug.get(slug)).filter((g): g is GameCardDTO => Boolean(g));
    const exclude = new Set([...recents.map((g) => g.slug), ...favs.map((g) => g.slug)]);
    const recs = recommendFromLocal(
      catalog,
      [...prefs.favorites, ...prefs.recentlyPlayed.map((r) => r.slug)],
      exclude
    );
    setContinuePlaying(recents);
    setFavorites(favs);
    setRecommended(recs);
    setReady(true);
  }, [catalog]);

  return { ready, continuePlaying, favorites, recommended };
}

export function ContinuePlayingRail({ catalog }: { catalog: GameCardDTO[] }) {
  const { ready, continuePlaying } = useLocalCatalog(catalog);
  if (!ready || continuePlaying.length === 0) return null;
  return <GameRail title="Continue playing" games={continuePlaying} />;
}

export function FavoritesRail({ catalog }: { catalog: GameCardDTO[] }) {
  const { ready, favorites } = useLocalCatalog(catalog);
  if (!ready || favorites.length === 0) return null;
  return <GameRail title="Favorites" games={favorites} />;
}

export function RecommendedRail({ catalog }: { catalog: GameCardDTO[] }) {
  const { ready, recommended } = useLocalCatalog(catalog);
  if (!ready || recommended.length === 0) return null;
  return <GameRail title="Recommended for you" games={recommended} />;
}
