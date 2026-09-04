import { prisma } from "@/lib/db";
import { gameCardInclude, toCardDTO } from "@/lib/games";
import { GameTable } from "@/components/admin/GameTable";
import { ButtonLink } from "@/components/ui/Button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Games" };

export default async function AdminGamesPage() {
  const rows = await prisma.game.findMany({
    include: gameCardInclude,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl">Games</h1>
        <ButtonLink href="/admin/games/new">Add game</ButtonLink>
      </div>
      <GameTable games={rows.map(toCardDTO)} />
    </div>
  );
}
