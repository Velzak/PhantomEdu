import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display text-sm text-ink">Phantom</p>
        <p className="text-sm text-muted">
          Original browser games, ready in one click. Built to play, not to stall.
        </p>
        <Link href="/search" className="text-sm text-signal hover:underline">
          Browse the catalog
        </Link>
      </div>
    </footer>
  );
}
