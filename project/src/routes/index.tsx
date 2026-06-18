import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { ProductCard } from "@/components/product-card";
import {
  categoriesQuery,
  featuredProductsQuery,
  productsListQuery,
} from "@/lib/marketplace";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VeloMarket — Unique finds from verified sellers" },
      { name: "description", content: "Browse handpicked products from independent, admin-approved sellers. Search, discover, and connect directly." },
      { property: "og:title", content: "VeloMarket — Unique finds from verified sellers" },
      { property: "og:description", content: "Browse handpicked products from independent, admin-approved sellers." },
    ],
  }),
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(categoriesQuery);
    void context.queryClient.ensureQueryData(featuredProductsQuery);
    void context.queryClient.ensureQueryData(productsListQuery());
  },
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <div>
        <h1 className="text-xl font-bold">Couldn't load the marketplace</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button onClick={reset} className="mt-4 px-4 py-2 rounded-xl bg-brand text-brand-foreground font-semibold text-sm">Try again</button>
      </div>
    </div>
  ),
  notFoundComponent: () => <div className="p-6">Not found</div>,
  component: HomePage,
});

function HomePage() {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("all");

  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const { data: featured } = useSuspenseQuery(featuredProductsQuery);
  const { data: products } = useSuspenseQuery(productsListQuery());

  const filtered = useMemo(() => {
    let list = products;
    if (activeCat !== "all") {
      list = list.filter((p) => p.category?.slug === activeCat);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.seller?.full_name.toLowerCase().includes(q),
      );
    }
    return list;
  }, [products, activeCat, search]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader search={search} onSearchChange={setSearch} />

      {/* Hero */}
      <section className="bg-card border-b border-border">
        <div className="mx-auto max-w-6xl px-4 pt-8 pb-6 sm:pt-14 sm:pb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand/10 rounded-full text-xs font-semibold text-brand mb-4">
              <Sparkles className="size-3.5" />
              <span>Curated marketplace</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold leading-tight tracking-tight text-balance">
              Find unique items from <span className="text-brand">verified</span> sellers.
            </h1>
            <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-lg text-pretty">
              Thousands of admin-approved makers, vintage hunters, and indie creators. One vibrant place to discover them.
            </p>
          </div>
        </div>
      </section>

      {/* Category pills */}
      <div className="border-b border-border bg-background sticky top-[64px] z-40">
        <div className="mx-auto max-w-6xl flex gap-2.5 overflow-x-auto px-4 py-3 no-scrollbar">
          {categories.map((cat) => {
            const active = cat.slug === activeCat;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.slug)}
                className={
                  "px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all shrink-0 " +
                  (active
                    ? "bg-brand text-brand-foreground shadow-lg shadow-brand/20"
                    : "bg-card border border-border text-foreground hover:border-brand/40")
                }
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 pb-24 space-y-12">
        {/* Featured */}
        {activeCat === "all" && !search && featured.length > 0 && (
          <section className="pt-8">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-2xl tracking-tight">Featured Drops</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Handpicked this week.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featured.slice(0, 3).map((p) => (
                <ProductCard key={p.id} product={p} featured />
              ))}
            </div>
          </section>
        )}

        {/* Seller CTA */}
        {activeCat === "all" && !search && (
          <section className="bg-foreground text-background rounded-3xl p-6 sm:p-10 relative overflow-hidden">
            <div className="relative z-10 grid sm:grid-cols-[1fr_auto] gap-6 items-end">
              <div className="max-w-md">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Start Selling Today</h2>
                <p className="text-background/70 text-sm mb-6 text-pretty">
                  Join our creator network. Every seller is manually reviewed by our team for quality and trust.
                </p>
                <div className="space-y-2.5 max-w-sm">
                  {[
                    "Submit ID & profile photo",
                    "Admin approval within 24h",
                    "List unlimited products",
                  ].map((step, i) => (
                    <div key={step} className="flex items-center gap-3">
                      <div className="size-6 rounded-full bg-brand text-brand-foreground grid place-items-center text-[11px] font-bold shrink-0">
                        {i + 1}
                      </div>
                      <span className="text-sm">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Link
                to="/seller/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-background text-foreground rounded-2xl font-bold text-sm shadow-xl hover:translate-y-[-2px] transition-transform shrink-0"
              >
                Apply to Sell <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="absolute -right-16 -bottom-16 size-64 bg-brand/30 blur-3xl rounded-full" />
            <div className="absolute -left-10 -top-10 size-40 bg-accent/20 blur-3xl rounded-full" />
          </section>
        )}

        {/* Latest / browse grid */}
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="font-bold text-2xl tracking-tight">
                {search ? `Results for "${search}"` : activeCat === "all" ? "Latest Arrivals" : categories.find(c => c.slug === activeCat)?.name}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} item{filtered.length === 1 ? "" : "s"}</p>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-12 text-center">
              <p className="text-muted-foreground">No products match your search yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>

        {/* Trust band */}
        <section className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: ShieldCheck, title: "Vetted sellers", desc: "Every account reviewed by our admin team." },
            { icon: CheckCircle2, title: "Direct contact", desc: "Message sellers directly — no middlemen." },
            { icon: Sparkles, title: "Fresh daily", desc: "New independent makers added every week." },
          ].map((b) => (
            <div key={b.title} className="bg-card rounded-2xl border border-border p-5">
              <b.icon className="size-5 text-brand mb-3" />
              <h3 className="font-bold text-sm">{b.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{b.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="size-7 bg-brand rounded-lg" />
            <span className="font-bold tracking-tight">VeloMarket</span>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} VeloMarket. A curated multi-vendor marketplace.</p>
        </div>
      </footer>
    </div>
  );
}
