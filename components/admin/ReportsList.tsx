"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/layout/ToastProvider";
import { EmptyState } from "@/components/ui/EmptyState";

type ReportRow = {
  id: string;
  message: string;
  resolved: boolean;
  createdAt: string;
  game: { id: string; title: string; slug: string };
};

export function ReportsList({ reports }: { reports: ReportRow[] }) {
  const router = useRouter();
  const toast = useToast();

  async function resolve(id: string) {
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update report");
      router.refresh();
    } catch (err) {
      toast.push(err instanceof Error ? err.message : "Network failure");
    }
  }

  if (reports.length === 0) {
    return (
      <EmptyState
        title="No reports"
        body="When a visitor flags a game, the message will show up here so you can mark it resolved."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {reports.map((report) => (
        <li key={report.id} className="rounded-xl bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <a href={`/games/${report.game.slug}`} className="font-medium hover:text-signal">
              {report.game.title}
            </a>
            <Badge tone={report.resolved ? "muted" : "danger"}>{report.resolved ? "Resolved" : "Open"}</Badge>
          </div>
          <p className="mt-2 text-sm text-ink">{report.message}</p>
          <p className="mt-2 text-xs text-muted">{format(new Date(report.createdAt), "MMM d, yyyy HH:mm")}</p>
          {!report.resolved ? (
            <Button className="mt-3" size="sm" type="button" onClick={() => void resolve(report.id)}>
              Mark resolved
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
