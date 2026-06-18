import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { ProductForm, type ProductFormValues } from "@/components/product-form";

export const Route = createFileRoute("/_authenticated/seller/products/new")({
  head: () => ({ meta: [{ title: "New product — VeloMarket" }] }),
  component: NewProductPage,
});

function NewProductPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("sellers")
        .select("id, status")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!data || data.status !== "approved") {
        navigate({ to: "/seller/products" });
        return;
      }
      setSellerId(data.id);
      setLoading(false);
    })();
  }, [user.id, navigate]);

  async function handleSubmit(v: ProductFormValues) {
    if (!sellerId) return;
    const { error } = await supabase.from("products").insert({
      seller_id: sellerId,
      title: v.title,
      description: v.description,
      price: v.price,
      category_id: v.category_id,
      images: v.images,
      location: v.location || null,
      contact_phone: v.contact_phone || null,
      contact_whatsapp: v.contact_whatsapp || null,
      contact_email: v.contact_email || null,
      available: v.available,
    });
    if (error) throw error;
    navigate({ to: "/seller/products" });
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

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-6 space-y-5">
        <Link to="/seller/products" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> My products
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">New product</h1>
        <ProductForm submitLabel="Publish product" onSubmit={handleSubmit} />
      </main>
    </div>
  );
}
