"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { format } from "date-fns";
import { GamePlayer } from "@/components/game/GamePlayer";
import { FavoriteButton } from "@/components/game/FavoriteButton";
import { RatingStars } from "@/components/game/RatingStars";
import { ReportModal } from "@/components/game/ReportModal";
import { GameRail } from "@/components/game/GameRail";
import { Badge } from "@/components/ui/Badge";
import { useFeatures } from "@/components/layout/FeaturesProvider";
import type { GameCardDTO } from "@/lib/games";
import { RecommendedRail } from "@/components/home/LocalRails";

export function GameDetail({
  game,
  related,
  catalog,
  entryUrl,
}: {
  game: GameCardDTO;
  related: GameCardDTO[];
  catalog: GameCardDTO[];
  entryUrl: string;
}) {
  const [reportOpen, setReportOpen] = useState(false);
  const { ratingsEnabled } = useFeatures();

  return (
    <article>
      <GamePlayer
        source={{ type: "html_upload", entryUrl }}
        gameId={game.id}
        slug={game.slug}
        title={game.title}
        onReport={() => setReportOpen(true)}
      />

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-signal">{game.category.name}</p>
          <h1 className="font-display text-3xl font-semibold">{game.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {game.tags.map((tag) => (
              <Badge key={tag.id} tone="muted">
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FavoriteButton slug={game.slug} title={game.title} />
          <button
            type="button"
            aria-label={`Report ${game.title}`}
            onClick={() => setReportOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-surface-2 px-3 text-sm hover:bg-surface"
          >
            <Flag size={16} />
            Report
          </button>
        </div>
      </div>

      <p className="mt-4 max-w-3xl text-muted">{game.description}</p>

      <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
        {game.controls ? (
          <div>
            <dt className="text-muted">Controls</dt>
            <dd>{game.controls}</dd>
          </div>
        ) : null}
        {game.developer ? (
          <div>
            <dt className="text-muted">Developer</dt>
            <dd>{game.developer}</dd>
          </div>
        ) : null}
        {game.releaseDate ? (
          <div>
            <dt className="text-muted">Released</dt>
            <dd>{format(new Date(game.releaseDate), "MMMM d, yyyy")}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-muted">Plays</dt>
          <dd>{game.playCount}</dd>
        </div>
      </dl>

      {ratingsEnabled ? (
        <div className="mt-6">
          <RatingStars
            gameId={game.id}
            slug={game.slug}
            ratingSum={game.ratingSum}
            ratingCount={game.ratingCount}
          />
        </div>
      ) : null}

      <GameRail title="More like this" games={related} />
      <RecommendedRail catalog={catalog} />

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        gameId={game.id}
        title={game.title}
      />
    </article>
  );
}
