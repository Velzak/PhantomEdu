import { prisma } from "@/lib/db";
import { ReportsList } from "@/components/admin/ReportsList";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    include: { game: { select: { id: true, title: true, slug: true } } },
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Reports</h1>
      <ReportsList
        reports={reports.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
