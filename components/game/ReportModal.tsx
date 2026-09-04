"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea, Label } from "@/components/ui/Input";
import { useToast } from "@/components/layout/ToastProvider";

export function ReportModal({
  open,
  onClose,
  gameId,
  title,
}: {
  open: boolean;
  onClose: () => void;
  gameId: string;
  title: string;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  if (!open) return null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send report");
      setMessage("");
      onClose();
      toast.push("Report sent. Thanks for flagging it.");
    } catch (err) {
      toast.push(err instanceof Error ? err.message : "Network failure");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="report-title">
      <form onSubmit={submit} className="w-full max-w-md rounded-xl bg-surface p-5">
        <h2 id="report-title" className="font-display text-lg">
          Report {title}
        </h2>
        <p className="mt-1 text-sm text-muted">Tell us what went wrong so it can be checked.</p>
        <div className="mt-4">
          <Label htmlFor="report-message">What happened?</Label>
          <Textarea
            id="report-message"
            required
            minLength={8}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="The game froze after the first level, controls did not respond…"
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Sending…" : "Send report"}
          </Button>
        </div>
      </form>
    </div>
  );
}
