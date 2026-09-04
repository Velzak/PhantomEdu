"use client";

import { ErrorState } from "@/components/ui/ErrorState";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body className="min-h-screen bg-[#0A0D14] text-[#E7E9EE]">
        <div className="mx-auto flex min-h-screen max-w-lg items-center px-4">
          <ErrorState
            title="Something on the server broke"
            body="The page could not be rendered. Retry, or refresh and pick a game from the homepage."
            actionLabel="Retry"
            onAction={reset}
          />
        </div>
      </body>
    </html>
  );
}
