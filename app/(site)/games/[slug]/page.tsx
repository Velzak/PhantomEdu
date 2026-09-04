import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { gameCardInclude, getPublishedGameBySlug, getRelatedGames, toCardDTO } from "@/lib/games";
import { gameEntryUrl } from "@/lib/env";
import { GameDetail } from "@/components/game/GameDetail";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const game = await getPublishedGameBySlug(params.slug);
  if (!game) return { title: "Game not found" };
  return { title: game.title, description: game.description };
}

export default async function GamePage({ params }: Props) {
  const row = await prisma.game.findUnique({
    where: { slug: params.slug },
    include: gameCardInclude,
  });

  if (!row) notFound();

  if (!row.published) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <EmptyState
          title="This game is not available"
          body="It exists in the catalog but is unpublished right now. Pick another title from the homepage."
        />
        <div className="mt-4">
          <ButtonLink href="/" variant="secondary">
            Back to the catalog
          </ButtonLink>
        </div>
      </div>
    );
  }

  const [related, catalogRows] = await Promise.all([
    getRelatedGames(row),
    prisma.game.findMany({
      where: { published: true },
      include: gameCardInclude,
      take: 240,
    }),
  ]);

  return (
    <GameDetail
      game={toCardDTO(row)}
      related={related}
      catalog={catalogRows.map(toCardDTO)}
      entryUrl={gameEntryUrl(row.entryPath)}
    />
  );
}
