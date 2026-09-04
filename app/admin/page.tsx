import { StatsCards } from "@/components/admin/StatsCards";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

export default async function AdminHomePage() {
  const recentPlays = await prisma.playEvent.findMany({
    orderBy: { playedAt: "desc" },
    take: 8,
    include: { game: { select: { title: true, slug: true } } },
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Dashboard</h1>
      <StatsCards />
      <section className="mt-10">
        <h2 className="font-display text-lg">Recent plays</h2>
        {recentPlays.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No play events yet. Open a game on the public site to record one.</p>
        ) : (
          <ul className="mt-3 divide-y divide-white/10 rounded-xl bg-surface">
            {recentPlays.map((event) => (
              <li key={event.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <Link href={`/games/${event.game.slug}`} className="hover:text-signal">
                  {event.game.title}
                </Link>
                <span className="text-muted">{format(event.playedAt, "MMM d, HH:mm")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
