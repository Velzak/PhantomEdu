import { NavBar } from "@/components/layout/NavBar";
import { Footer } from "@/components/layout/Footer";
import { FeaturesProvider } from "@/components/layout/FeaturesProvider";
import { getCategories } from "@/lib/games";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();
  return (
    <FeaturesProvider ratingsEnabled={env().ratingsEnabled}>
      <div className="flex min-h-screen flex-col">
        <NavBar categories={categories.map((c) => ({ name: c.name, slug: c.slug }))} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
        <Footer />
      </div>
    </FeaturesProvider>
  );
}
