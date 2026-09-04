"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { hasRated, markRated } from "@/lib/localPrefs";
import { useToast } from "@/components/layout/ToastProvider";
import { averageRating } from "@/lib/games";

export function RatingStars({
  gameId,
  slug,
  ratingSum,
  ratingCount,
}: {
  gameId: string;
  slug: string;
  ratingSum: number;
  ratingCount: number;
}) {
  const toast = useToast();
  const [sum, setSum] = useState(ratingSum);
  const [count, setCount] = useState(ratingCount);
  const [locked, setLocked] = useState(() => hasRated(slug));
  const [hover, setHover] = useState(0);
  const avg = averageRating(sum, count);

  async function submit(value: number) {
    if (locked) return;
    try {
      const res = await fetch(`/api/games/${gameId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save rating");
      setSum(data.ratingSum);
      setCount(data.ratingCount);
      markRated(slug);
      setLocked(true);
    } catch (err) {
      toast.push(err instanceof Error ? err.message : "Network failure", {
        actionLabel: "Retry",
        onAction: () => void submit(value),
      });
    }
  }

  return (
    <div>
      <p className="text-sm text-muted">
        {count > 0 ? `${avg.toFixed(1)} from ${count} rating${count === 1 ? "" : "s"}` : "No ratings yet"}
      </p>
      <div className="mt-1 flex items-center gap-1" role="group" aria-label="Rate this game">
        {[1, 2, 3, 4, 5].map((value) => {
          const filled = (hover || Math.round(avg)) >= value;
          return (
            <button
              key={value}
              type="button"
              disabled={locked}
              aria-label={`Rate ${value} star${value === 1 ? "" : "s"}`}
              onMouseEnter={() => !locked && setHover(value)}
              onMouseLeave={() => setHover(0)}
              onClick={() => void submit(value)}
              className="rounded p-0.5 text-signal disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Star size={22} fill={filled ? "currentColor" : "none"} />
            </button>
          );
        })}
      </div>
      {locked ? <p className="mt-1 text-xs text-muted">You already rated this game in this browser.</p> : null}
    </div>
  );
}
