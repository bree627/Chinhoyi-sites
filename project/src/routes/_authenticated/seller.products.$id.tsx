import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { ProductForm, type ProductFormValues } from "@/components/product-form";

export const Route = createFileRoute("/_authenticated/seller/products/$id")({
  head: () => ({ meta: [{ title: "Edit product — VeloMarket" }] }),
  component: EditProductPage,
});

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  category_id: string | null;
  images: string[];
  location: string | null;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  contact_email: string | null;
  available: boolean;
};

function EditProductPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("id, title, description, price, category_id, images, location, contact_phone, contact_whatsapp, contact_email, available")
        .eq("id", id)
        .maybeSingle();
      setProduct((data as Product | null) ?? null);
      setLoading(false);
    })();
  }, [id]);

  async function handleSubmit(v: ProductFormValues) {
    const { error } = await supabase
      .from("products")
      .update({
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
      })
      .eq("id", id);
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

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-lg px-4 py-12 text-center">
          <p className="text-muted-foreground">Product not found.</p>
          <Link to="/seller/products" className="text-brand font-semibold text-sm mt-3 inline-block">Back to my products</Link>
        </main>
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
        <h1 className="text-3xl font-bold tracking-tight">Edit product</h1>
        <ProductForm
          submitLabel="Save changes"
          onSubmit={handleSubmit}
          initial={{
            title: product.title,
            description: product.description,
            price: Number(product.price),
            category_id: product.category_id,
            images: product.images,
            location: product.location ?? "",
            contact_phone: product.contact_phone ?? "",
            contact_whatsapp: product.contact_whatsapp ?? "",
            contact_email: product.contact_email ?? "",
            available: product.available,
          }}
        />
      </main>
    </div>
  );
}
