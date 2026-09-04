"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { MobileNav } from "@/components/layout/MobileNav";
import { Input } from "@/components/ui/Input";
import type { GameCardDTO } from "@/lib/games";

type Category = { name: string; slug: string };

export function NavBar({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [openCats, setOpenCats] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<GameCardDTO[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const timer = useRef<number>();

  useEffect(() => {
    window.clearTimeout(timer.current);
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    timer.current = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}&pageSize=6`);
        const data = await res.json();
        setSuggestions(data.games ?? []);
        setShowSuggest(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => window.clearTimeout(timer.current);
  }, [q]);

  function submitSearch(event?: React.FormEvent) {
    event?.preventDefault();
    setShowSuggest(false);
    setMobileOpen(false);
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-void/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link href="/" className="shrink-0 font-display text-lg font-semibold tracking-tight text-ink">
          Phantom
        </Link>

        <div className="relative hidden md:block">
          <button
            type="button"
            className="rounded-md px-3 py-2 text-sm text-ink hover:bg-surface-2"
            onClick={() => setOpenCats((v) => !v)}
            aria-expanded={openCats}
            aria-haspopup="true"
          >
            Categories
          </button>
          {openCats ? (
            <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-white/10 bg-surface p-2 shadow-lift">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/categories/${cat.slug}`}
                  className="block rounded px-3 py-2 text-sm text-ink hover:bg-surface-2"
                  onClick={() => setOpenCats(false)}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <form onSubmit={submitSearch} className="relative hidden min-w-0 flex-1 md:block">
          <label htmlFor="site-search" className="sr-only">
            Search games
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            id="site-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => suggestions.length && setShowSuggest(true)}
            onBlur={() => window.setTimeout(() => setShowSuggest(false), 150)}
            placeholder="Search titles, tags, developers"
            className="pl-9"
            autoComplete="off"
          />
          {showSuggest && suggestions.length > 0 ? (
            <ul className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-white/10 bg-surface shadow-lift">
              {suggestions.map((game) => (
                <li key={game.id}>
                  <Link
                    href={`/games/${game.slug}`}
                    className="block px-3 py-2 text-sm hover:bg-surface-2"
                  >
                    <span className="text-ink">{game.title}</span>
                    <span className="ml-2 text-muted">{game.category.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </form>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-surface-2 md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <MobileNav
        open={mobileOpen}
        categories={categories}
        q={q}
        onQuery={setQ}
        onSearch={submitSearch}
        onClose={() => setMobileOpen(false)}
      />
    </header>
  );
}
