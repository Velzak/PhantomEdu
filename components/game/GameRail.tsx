import { GameCard } from "@/components/game/GameCard";
import type { GameCardDTO } from "@/lib/gameView";

export function GameRail({
  title,
  games,
  trending = false,
  empty,
}: {
  title: string;
  games: GameCardDTO[];
  trending?: boolean;
  empty?: React.ReactNode;
}) {
  if (games.length === 0) return empty ? <>{empty}</> : null;

  return (
    <section className="mt-10">
      <h2 className="mb-4 font-display text-xl text-ink">{title}</h2>
      <div className="rail">
        {games.map((game) => (
          <GameCard key={game.id} game={game} trending={trending} />
        ))}
      </div>
    </section>
  );
}
