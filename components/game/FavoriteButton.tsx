"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { loadPrefs, toggleFavorite } from "@/lib/localPrefs";

export function FavoriteButton({ slug, title }: { slug: string; title: string }) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(loadPrefs().favorites.includes(slug));
  }, [slug]);

  return (
    <button
      type="button"
      aria-label={on ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
      aria-pressed={on}
      onClick={() => {
        const next = toggleFavorite(slug);
        setOn(next.favorites.includes(slug));
      }}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-surface-2 text-ink hover:bg-surface"
    >
      <Heart size={18} fill={on ? "currentColor" : "none"} className={on ? "text-danger" : ""} />
    </button>
  );
}
