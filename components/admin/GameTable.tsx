"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { GameCardDTO } from "@/lib/games";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/layout/ToastProvider";

export function GameTable({ games }: { games: GameCardDTO[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const router = useRouter();
  const toast = useToast();

  const filtered = useMemo(() => {
    const list = games.filter((g) => {
      const hay = `${g.title} ${g.slug} ${g.category.name}`.toLowerCase();
      if (q && !hay.includes(q.toLowerCase())) return false;
      if (status === "published" && !g.published) return false;
      if (status === "draft" && g.published) return false;
      if (status === "featured" && !g.featured) return false;
      return true;
    });
    list.sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "plays") return b.playCount - a.playCount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [games, q, status, sort]);

  async function patch(id: string, body: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/games/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      router.refresh();
    } catch (err) {
      toast.push(err instanceof Error ? err.message : "Network failure");
    }
  }

  async function remove(id: string, title: string) {
    if (!confirm(`Delete ${title}? This removes the files too.`)) return;
    try {
      const res = await fetch(`/api/games/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      router.refresh();
    } catch (err) {
      toast.push(err instanceof Error ? err.message : "Network failure");
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search games"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search games"
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="all">All</option>
          <option value="published">Published</option>
          <option value="draft">Unpublished</option>
          <option value="featured">Featured</option>
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort games">
          <option value="newest">Newest</option>
          <option value="title">Title</option>
          <option value="plays">Plays</option>
        </Select>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-surface-2 text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Title</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Plays</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((game) => (
              <tr key={game.id} className="border-t border-white/10">
                <td className="px-3 py-2">
                  <Link href={`/admin/games/${game.id}/edit`} className="font-medium hover:text-signal">
                    {game.title}
                  </Link>
                  <div className="text-xs text-muted">{game.slug}</div>
                </td>
                <td className="px-3 py-2">{game.category.name}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <Badge tone={game.published ? "signal" : "muted"}>{game.published ? "Published" : "Draft"}</Badge>
                    {game.featured ? <Badge tone="accent">Featured</Badge> : null}
                  </div>
                </td>
                <td className="px-3 py-2">{game.playCount}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => void patch(game.id, { published: !game.published })}
                    >
                      {game.published ? "Unpublish" : "Publish"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => void patch(game.id, { featured: !game.featured })}
                    >
                      {game.featured ? "Unfeature" : "Feature"}
                    </Button>
                    <Button type="button" size="sm" variant="danger" onClick={() => void remove(game.id, game.title)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted">No games match those filters.</p>
        ) : null}
      </div>
    </div>
  );
}
