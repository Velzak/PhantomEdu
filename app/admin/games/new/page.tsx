import { getCategories, getTags } from "@/lib/games";
import { GameForm } from "@/components/admin/GameForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Add game" };

export default async function NewGamePage() {
  const [categories, tags] = await Promise.all([getCategories(), getTags()]);
  const hostedOnVercel = Boolean(process.env.VERCEL);
  return (
    <div>
      {hostedOnVercel ? (
        <p className="mb-5 rounded-lg border border-signal/40 bg-signal/10 px-3 py-2 text-sm">
          This Vercel host cannot keep uploads. Each request gets a fresh disk, so a new game
          vanishes after save. For a game you created as a single self-contained HTML file, run
          <code className="mx-1 rounded bg-surface-2 px-1">npm run dev</code>
          locally and add it there.
        </p>
      ) : null}
      {categories.length === 0 ? (
        <p className="mb-5 text-sm text-danger">
          No categories exist yet, so the form cannot submit. Seed the database first (
          <code>npm run seed</code>).
        </p>
      ) : null}
      <GameForm categories={categories} tags={tags} />
    </div>
  );
}
