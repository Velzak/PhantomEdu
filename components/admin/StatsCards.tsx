import { prisma } from "@/lib/db";

export async function StatsCards() {
  const sinceDay = new Date();
  sinceDay.setHours(0, 0, 0, 0);
  const sinceWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const sinceMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [games, plays, mostPlayed, unresolved, today, week, month] = await Promise.all([
    prisma.game.count(),
    prisma.game.aggregate({ _sum: { playCount: true } }),
    prisma.game.findFirst({ orderBy: { playCount: "desc" } }),
    prisma.report.count({ where: { resolved: false } }),
    prisma.playEvent.count({ where: { playedAt: { gte: sinceDay } } }),
    prisma.playEvent.count({ where: { playedAt: { gte: sinceWeek } } }),
    prisma.playEvent.count({ where: { playedAt: { gte: sinceMonth } } }),
  ]);

  const cards = [
    { label: "Games", value: String(games) },
    { label: "Total plays", value: String(plays._sum.playCount ?? 0) },
    { label: "Most played", value: mostPlayed?.title ?? "None yet" },
    { label: "Open reports", value: String(unresolved) },
    { label: "Plays today", value: String(today) },
    { label: "Plays this week", value: String(week) },
    { label: "Plays this month", value: String(month) },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl bg-surface p-4">
          <p className="text-sm text-muted">{card.label}</p>
          <p className="mt-1 font-display text-2xl">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
