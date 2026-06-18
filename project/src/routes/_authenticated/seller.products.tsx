import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Loader2, Plus, Eye, Pencil, Trash2, Package, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/marketplace";

export const Route = createFileRoute("/_authenticated/seller/products")({
  head: () => ({ meta: [{ title: "My products — VeloMarket" }] }),
  component: SellerProductsPage,
});

type Product = {
  id: string;
  title: string;
  price: number;
  images: string[];
  available: boolean;
  featured: boolean;
  views: number;
  created_at: string;
};

function SellerProductsPage() {
  const { user } = Route.useRouteContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellerStatus, setSellerStatus] = useState<string | null>(null);
  const [sellerId, setSellerId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: seller } = await supabase
      .from("sellers")
      .select("id, status")
      .eq("user_id", user.id)
      .maybeSingle();
    setSellerStatus(seller?.status ?? null);
    setSellerId(seller?.id ?? null);
    if (!seller) {
      setProducts([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("products")
      .select("id, title, price, images, available, featured, views, created_at")
      .eq("seller_id", seller.id)
      .order("created_at", { ascending: false });
    setProducts((data as Product[] | null) ?? []);
    setLoading(false);
  }, [user.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(p: Product) {
    if (!confirm(`Delete "${p.title}"?`)) return;
    await supabase.from("products").delete().eq("id", p.id);
    load();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="grid place-items-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (sellerStatus !== "approved") {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-lg px-4 py-12 text-center">
          <div className="bg-card border border-border rounded-3xl p-8">
            <div className="size-12 mx-auto rounded-2xl bg-warning/10 text-warning grid place-items-center mb-4">
              <Sparkles className="size-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Seller approval required</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {sellerStatus
                ? "Your seller application is " + sellerStatus + ". You'll be able to list products once approved."
                : "You haven't applied yet. Submit a seller application to get started."}
            </p>
            <Link
              to={sellerStatus ? "/seller/dashboard" : "/seller/register"}
              className="inline-flex items-center gap-1.5 px-5 h-11 mt-5 rounded-2xl bg-brand text-brand-foreground font-bold text-sm"
            >
              {sellerStatus ? "Back to dashboard" : "Apply now"}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-6 space-y-5">
        <Link to="/seller/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Dashboard
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My products</h1>
            <p className="text-sm text-muted-foreground mt-1">{products.length} listing{products.length === 1 ? "" : "s"}</p>
          </div>
          <Link
            to="/seller/products/new"
            className="inline-flex items-center gap-1.5 px-4 h-11 rounded-2xl bg-brand text-brand-foreground font-bold text-sm shadow-lg shadow-brand/20"
          >
            <Plus className="size-4" /> New product
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="bg-card border border-border rounded-3xl p-10 text-center">
            <div className="size-12 mx-auto rounded-2xl bg-brand/10 text-brand grid place-items-center mb-4">
              <Package className="size-6" />
            </div>
            <h2 className="font-bold text-lg">No listings yet</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Add your first product to start selling.</p>
            <Link
              to="/seller/products/new"
              className="inline-flex items-center gap-1.5 px-5 h-11 rounded-2xl bg-foreground text-background font-bold text-sm"
            >
              <Plus className="size-4" /> Add product
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {products.map((p) => (
              <div key={p.id} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3">
                <div className="size-16 rounded-xl bg-secondary overflow-hidden shrink-0">
                  {p.images[0] && (
                    <img src={p.images[0]} alt={p.title} className="size-full object-cover" loading="lazy" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold truncate">{p.title}</h3>
                    {p.featured && <span className="text-[10px] font-bold uppercase bg-accent/10 text-accent px-2 py-0.5 rounded-full">Featured</span>}
                    {!p.available && <span className="text-[10px] font-bold uppercase bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Hidden</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{formatPrice(p.price)} · {p.views} views</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Link
                    to="/product/$id"
                    params={{ id: p.id }}
                    className="size-9 grid place-items-center rounded-xl bg-secondary"
                    aria-label="View"
                  >
                    <Eye className="size-4" />
                  </Link>
                  <Link
                    to="/seller/products/$id"
                    params={{ id: p.id }}
                    className="size-9 grid place-items-center rounded-xl bg-secondary"
                    aria-label="Edit"
                  >
                    <Pencil className="size-4" />
                  </Link>
                  <button
                    onClick={() => remove(p)}
                    className="size-9 grid place-items-center rounded-xl bg-destructive/10 text-destructive"
                    aria-label="Delete"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {sellerId && <div className="hidden" data-seller-id={sellerId} />}
      </main>
    </div>
  );
}
