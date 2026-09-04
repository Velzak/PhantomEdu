"use client";

import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { GameCardDTO } from "@/lib/gameView";
import { averageRating, isNewGame } from "@/lib/gameView";
import { useFeatures } from "@/components/layout/FeaturesProvider";

export function GameThumbnail({
  game,
  className = "",
}: {
  game: Pick<GameCardDTO, "title" | "thumbnailUrl">;
  className?: string;
}) {
  if (game.thumbnailUrl) {
    return (
      <Image
        src={game.thumbnailUrl}
        alt={`${game.title} thumbnail`}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 180px"
        className={`thumb-img object-cover ${className}`}
      />
    );
  }
  const initial = game.title.slice(0, 1).toUpperCase();
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_30%_20%,#2a3350,transparent_55%),linear-gradient(160deg,#1b2030,#131722)] ${className}`}
      aria-hidden="true"
    >
      <span className="font-display text-3xl text-ink/80">{initial}</span>
    </div>
  );
}

export function GameCard({
  game,
  trending = false,
  className = "w-[160px] sm:w-[180px]",
}: {
  game: GameCardDTO;
  trending?: boolean;
  className?: string;
}) {
  const { ratingsEnabled } = useFeatures();
  const avg = averageRating(game.ratingSum, game.ratingCount);
  const showNew = isNewGame(game.createdAt);
  const showRating = ratingsEnabled && game.ratingCount > 0;

  return (
    <article className={className}>
      <Link href={`/games/${game.slug}`} className="card-playable group block">
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface">
          <GameThumbnail game={game} />
          <div className="play-cue absolute inset-0 flex items-center justify-center bg-black/35">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white">
              <Play size={18} fill="currentColor" />
            </span>
          </div>
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            {showNew ? <Badge tone="signal">NEW</Badge> : null}
            {trending ? <Badge tone="signal">TRENDING</Badge> : null}
          </div>
        </div>
        <h3 className="mt-2 truncate font-medium text-ink">{game.title}</h3>
        <p className="truncate text-xs text-muted">{game.category.name}</p>
        <p className="mt-0.5 text-xs text-muted">
          {showRating ? `${avg.toFixed(1)} · ` : null}
          {game.playCount > 0 ? `${game.playCount} plays` : "Unplayed"}
        </p>
      </Link>
    </article>
  );
}
