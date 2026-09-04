"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/validation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, Label } from "@/components/ui/Input";
import { useToast } from "@/components/layout/ToastProvider";
import type { GameCardDTO } from "@/lib/gameView";

type Tax = { id: string; name: string; slug: string };

export function GameForm({
  game,
  categories,
  tags,
}: {
  game?: GameCardDTO;
  categories: Tax[];
  tags: Tax[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [title, setTitle] = useState(game?.title ?? "");
  const [slug, setSlug] = useState(game?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(game));
  const [description, setDescription] = useState(game?.description ?? "");
  const [categoryId, setCategoryId] = useState(game?.category.id ?? categories[0]?.id ?? "");
  const [tagIds, setTagIds] = useState<string[]>(game?.tags.map((t) => t.id) ?? []);
  const [controls, setControls] = useState(game?.controls ?? "");
  const [developer, setDeveloper] = useState(game?.developer ?? "");
  const [releaseDate, setReleaseDate] = useState(game?.releaseDate ? game.releaseDate.slice(0, 10) : "");
  const [featured, setFeatured] = useState(game?.featured ?? false);
  const [published, setPublished] = useState(game?.published ?? true);
  const [busy, setBusy] = useState(false);
  const [cats, setCats] = useState(categories);
  const [tagList, setTagList] = useState(tags);
  const [newCat, setNewCat] = useState("");
  const [newTag, setNewTag] = useState("");

  const heading = game ? `Edit ${game.title}` : "Add a game";

  const canSubmit = useMemo(() => title && slug && description && categoryId, [title, slug, description, categoryId]);

  function onTitle(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function createCategory() {
    const name = newCat.trim();
    if (!name) return;
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create category");
      setCats((c) => [...c, data].sort((a, b) => a.name.localeCompare(b.name)));
      setCategoryId(data.id);
      setNewCat("");
    } catch (err) {
      toast.push(err instanceof Error ? err.message : "Network failure");
    }
  }

  async function renameCategory() {
    const cat = cats.find((c) => c.id === categoryId);
    if (!cat) return;
    const name = prompt("Rename category", cat.name);
    if (!name) return;
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not rename");
      setCats((list) => list.map((c) => (c.id === cat.id ? data : c)));
    } catch (err) {
      toast.push(err instanceof Error ? err.message : "Network failure");
    }
  }

  async function deleteCategory() {
    const cat = cats.find((c) => c.id === categoryId);
    if (!cat) return;
    if (!confirm(`Delete category ${cat.name}?`)) return;
    try {
      const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete");
      setCats((list) => list.filter((c) => c.id !== cat.id));
      setCategoryId(cats.find((c) => c.id !== cat.id)?.id ?? "");
    } catch (err) {
      toast.push(err instanceof Error ? err.message : "Network failure");
    }
  }

  async function createTag() {
    const name = newTag.trim();
    if (!name) return;
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create tag");
      setTagList((t) => [...t, data].sort((a, b) => a.name.localeCompare(b.name)));
      setTagIds((ids) => [...ids, data.id]);
      setNewTag("");
    } catch (err) {
      toast.push(err instanceof Error ? err.message : "Network failure");
    }
  }

  async function renameTag(id: string) {
    const tag = tagList.find((t) => t.id === id);
    if (!tag) return;
    const name = prompt("Rename tag", tag.name);
    if (!name) return;
    try {
      const res = await fetch(`/api/tags/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not rename");
      setTagList((list) => list.map((t) => (t.id === id ? data : t)));
    } catch (err) {
      toast.push(err instanceof Error ? err.message : "Network failure");
    }
  }

  async function deleteTag(id: string) {
    if (!confirm("Delete this tag?")) return;
    try {
      const res = await fetch(`/api/tags/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete");
      setTagList((list) => list.filter((t) => t.id !== id));
      setTagIds((ids) => ids.filter((x) => x !== id));
    } catch (err) {
      toast.push(err instanceof Error ? err.message : "Network failure");
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const gameFile = (form.elements.namedItem("gameFile") as HTMLInputElement)?.files?.[0];
    if (!game && !gameFile) {
      toast.push("Attach an HTML game file to create this listing.");
      return;
    }
    setBusy(true);
    const body = new FormData();
    body.set("title", title);
    body.set("slug", slug);
    body.set("description", description);
    body.set("categoryId", categoryId);
    body.set("tagIds", tagIds.join(","));
    body.set("controls", controls);
    body.set("developer", developer);
    body.set("releaseDate", releaseDate);
    body.set("featured", String(featured));
    body.set("published", String(published));
    if (gameFile) body.set("gameFile", gameFile);
    const thumb = (form.elements.namedItem("thumbnail") as HTMLInputElement)?.files?.[0];
    if (thumb) body.set("thumbnail", thumb);

    try {
      const url = game ? `/api/games/${game.id}` : "/api/games";
      const res = await fetch(url, { method: game ? "PATCH" : "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save game");
      router.push("/admin/games");
      router.refresh();
    } catch (err) {
      toast.push(err instanceof Error ? err.message : "Network failure");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-5">
      <h1 className="font-display text-2xl">{heading}</h1>
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => onTitle(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="categoryId">Category</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select id="categoryId" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            {cats.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
          <Button type="button" variant="secondary" onClick={() => void renameCategory()}>
            Rename
          </Button>
          <Button type="button" variant="ghost" onClick={() => void deleteCategory()}>
            Delete
          </Button>
        </div>
        <div className="mt-2 flex gap-2">
          <Input placeholder="New category" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
          <Button type="button" variant="secondary" onClick={() => void createCategory()}>
            Add category
          </Button>
        </div>
      </div>
      <fieldset>
        <legend className="mb-1 text-sm font-medium">Tags</legend>
        <div className="flex flex-wrap gap-2">
          {tagList.map((tag) => (
            <label key={tag.id} className="inline-flex items-center gap-2 rounded-md bg-surface-2 px-2 py-1 text-sm">
              <input
                type="checkbox"
                checked={tagIds.includes(tag.id)}
                onChange={(e) =>
                  setTagIds((ids) => (e.target.checked ? [...ids, tag.id] : ids.filter((id) => id !== tag.id)))
                }
              />
              {tag.name}
              <button type="button" className="text-xs text-muted hover:text-ink" onClick={() => void renameTag(tag.id)}>
                Rename
              </button>
              <button type="button" className="text-xs text-danger" onClick={() => void deleteTag(tag.id)}>
                Delete
              </button>
            </label>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <Input placeholder="New tag" value={newTag} onChange={(e) => setNewTag(e.target.value)} />
          <Button type="button" variant="secondary" onClick={() => void createTag()}>
            Add tag
          </Button>
        </div>
      </fieldset>
      <div>
        <Label htmlFor="controls">Controls</Label>
        <Input id="controls" value={controls} onChange={(e) => setControls(e.target.value)} placeholder="Arrow keys or WASD" />
      </div>
      <div>
        <Label htmlFor="developer">Developer</Label>
        <Input id="developer" value={developer} onChange={(e) => setDeveloper(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="releaseDate">Release date</Label>
        <Input id="releaseDate" type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="gameFile">{game ? "Replace HTML file (optional)" : "HTML game file"}</Label>
        <Input id="gameFile" name="gameFile" type="file" accept=".html,.htm,text/html" required={!game} />
      </div>
      <div>
        <Label htmlFor="thumbnail">Thumbnail (optional)</Label>
        <Input id="thumbnail" name="thumbnail" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
        Published
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
        Featured on homepage
      </label>
      <Button type="submit" disabled={busy || !canSubmit}>
        {busy ? "Saving…" : game ? "Save changes" : "Create game"}
      </Button>
    </form>
  );
}
