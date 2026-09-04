"use client";

import { ErrorState } from "@/components/ui/ErrorState";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="py-16">
      <ErrorState
        title="This page failed to load"
        body="A request or render failed. Retry, or go back and choose another game."
        actionLabel="Retry"
        onAction={reset}
      />
    </div>
  );
}
