import Link from "next/link";

export function CategoryChips({
  categories,
}: {
  categories: { name: string; slug: string; count?: number }[];
}) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 font-display text-xl">Browse by category</h2>
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/categories/${cat.slug}`}
            className="rounded-full bg-surface px-4 py-2 text-sm text-ink hover:bg-surface-2"
          >
            {cat.name}
            {typeof cat.count === "number" ? (
              <span className="ml-2 text-muted">{cat.count}</span>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
