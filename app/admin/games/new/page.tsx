import { getCategories, getTags } from "@/lib/games";
import { GameForm } from "@/components/admin/GameForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Add game" };

export default async function NewGamePage() {
  const [categories, tags] = await Promise.all([getCategories(), getTags()]);
  return <GameForm categories={categories} tags={tags} />;
}
