"use client";

import Link from "next/link";
import { Input } from "@/components/ui/Input";

export function MobileNav({
  open,
  categories,
  q,
  onQuery,
  onSearch,
  onClose,
}: {
  open: boolean;
  categories: { name: string; slug: string }[];
  q: string;
  onQuery: (value: string) => void;
  onSearch: (event?: React.FormEvent) => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="border-t border-white/10 bg-void px-4 py-4 md:hidden">
      <form onSubmit={onSearch} className="relative">
        <Input value={q} onChange={(e) => onQuery(e.target.value)} placeholder="Search games" aria-label="Search games" />
      </form>
      <nav className="mt-4 grid gap-1" aria-label="Categories">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/categories/${cat.slug}`}
            className="rounded-md px-2 py-2 text-sm hover:bg-surface-2"
            onClick={onClose}
          >
            {cat.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
