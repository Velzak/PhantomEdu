"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function FilterBar({
  categories,
  tags,
  current,
  basePath,
}: {
  categories: { name: string; slug: string }[];
  tags: { name: string; slug: string }[];
  current: { q?: string; category?: string; tag?: string; sort?: string };
  basePath: string;
}) {
  const router = useRouter();

  function update(patch: Record<string, string>) {
    const next = { ...current, ...patch };
    if (patch.category && basePath.startsWith("/categories/")) {
      const params = new URLSearchParams();
      if (next.tag) params.set("tag", next.tag);
      if (next.sort && next.sort !== "popular") params.set("sort", next.sort);
      if (next.q) params.set("q", next.q);
      const qs = params.toString();
      router.push(qs ? `/categories/${patch.category}?${qs}` : `/categories/${patch.category}`);
      return;
    }
    const params = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  const hasFilters = Boolean(current.q || current.category || current.tag || (current.sort && current.sort !== "popular"));

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <label className="block min-w-[160px] flex-1 text-sm">
        <span className="mb-1 block text-muted">Category</span>
        <Select
          value={current.category ?? ""}
          onChange={(e) => update({ category: e.target.value })}
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat.slug} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </Select>
      </label>
      <label className="block min-w-[160px] flex-1 text-sm">
        <span className="mb-1 block text-muted">Tag</span>
        <Select value={current.tag ?? ""} onChange={(e) => update({ tag: e.target.value })}>
          <option value="">All tags</option>
          {tags.map((tag) => (
            <option key={tag.slug} value={tag.slug}>
              {tag.name}
            </option>
          ))}
        </Select>
      </label>
      <label className="block min-w-[160px] text-sm">
        <span className="mb-1 block text-muted">Sort</span>
        <Select value={current.sort ?? "popular"} onChange={(e) => update({ sort: e.target.value })}>
          <option value="popular">Popular</option>
          <option value="newest">Newest</option>
          <option value="alphabetical">Alphabetical</option>
          <option value="rating">Highest Rated</option>
        </Select>
      </label>
      {hasFilters ? (
        <Button type="button" variant="ghost" onClick={() => router.push(basePath.includes("/search") ? "/search" : basePath)}>
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
