import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { gameCardInclude, getCategories, getTags, toCardDTO } from "@/lib/games";
import { GameForm } from "@/components/admin/GameForm";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export default async function EditGamePage({ params }: Props) {
  const [game, categories, tags] = await Promise.all([
    prisma.game.findUnique({ where: { id: params.id }, include: gameCardInclude }),
    getCategories(),
    getTags(),
  ]);
  if (!game) notFound();
  return <GameForm game={toCardDTO(game)} categories={categories} tags={tags} />;
}
