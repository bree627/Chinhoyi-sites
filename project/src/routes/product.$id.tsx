import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { formatPrice, productByIdQuery } from "@/lib/marketplace";

export const Route = createFileRoute("/product/$id")({
  loader: async ({ context, params }) => {
    const product = await context.queryClient.ensureQueryData(productByIdQuery(params.id));
    if (!product) throw notFound();
  },
  head: ({ loaderData: _ld, params }) => ({
    meta: [
      { title: `Product · VeloMarket` },
      { name: "description", content: `View product details on VeloMarket.` },
      { property: "og:title", content: `Product · VeloMarket` },
    ],
    // og:image gets set dynamically below in the component head via params if needed
  }),
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <div>
        <h1 className="text-xl font-bold">Couldn't load this product</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button onClick={reset} className="mt-4 px-4 py-2 rounded-xl bg-brand text-brand-foreground font-semibold text-sm">Try again</button>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <div>
        <h1 className="text-xl font-bold">Product not found</h1>
        <Link to="/" className="mt-4 inline-flex px-4 py-2 rounded-xl bg-brand text-brand-foreground font-semibold text-sm">Back to home</Link>
      </div>
    </div>
  ),
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  const { data: product } = useSuspenseQuery(productByIdQuery(id));
  const [activeImg, setActiveImg] = useState(0);

  if (!product) return null;

  const phone = product.contact_phone ?? product.seller?.phone ?? "";
  const wa = product.contact_whatsapp ?? "";
  const email = product.contact_email ?? product.seller?.email ?? "";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5">
          <ArrowLeft className="size-4" /> Back to marketplace
        </Link>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Gallery */}
          <div>
            <div className="w-full aspect-square bg-secondary rounded-3xl overflow-hidden border border-border">
              {product.images[activeImg] && (
                <img src={product.images[activeImg]} alt={product.title} className="w-full h-full object-cover" />
              )}
            </div>
            {product.images.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {product.images.map((src, i) => (
                  <button
                    key={src + i}
                    onClick={() => setActiveImg(i)}
                    className={
                      "aspect-square rounded-xl overflow-hidden border-2 transition-all " +
                      (i === activeImg ? "border-brand" : "border-border opacity-70")
                    }
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {product.category && (
              <p className="text-xs font-bold text-accent uppercase tracking-widest mb-2">
                {product.category.name}
              </p>
            )}
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">{product.title}</h1>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-3xl font-bold text-brand">{formatPrice(product.price)}</span>
              {product.available ? (
                <span className="px-2.5 py-1 rounded-full bg-success/10 text-success text-[11px] font-bold uppercase tracking-wider">
                  Available
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                  Sold
                </span>
              )}
            </div>

            <p className="mt-6 text-base text-foreground/80 text-pretty whitespace-pre-line">
              {product.description}
            </p>

            {product.location && (
              <div className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4" /> {product.location}
              </div>
            )}

            {/* Seller card */}
            {product.seller && (
              <div className="mt-6 bg-card rounded-2xl border border-border p-4 flex items-center gap-4">
                {product.seller.avatar_url ? (
                  <img src={product.seller.avatar_url} alt="" className="size-12 rounded-full object-cover" />
                ) : (
                  <div className="size-12 rounded-full bg-secondary" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm truncate">{product.seller.full_name}</h3>
                    {product.seller.verified && (
                      <CheckCircle2 className="size-3.5 text-success" />
                    )}
                  </div>
                  {product.seller.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{product.seller.bio}</p>
                  )}
                </div>
              </div>
            )}

            {/* Contact buttons */}
            <div className="mt-6 space-y-2.5">
              {wa && (
                <a
                  href={`https://wa.me/${wa.replace(/[^0-9]/g, "")}?text=Hi, I'm interested in ${encodeURIComponent(product.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-success text-success-foreground rounded-2xl font-bold text-sm hover:opacity-95 transition"
                >
                  <MessageCircle className="size-4" /> Message on WhatsApp
                </a>
              )}
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand text-brand-foreground rounded-2xl font-bold text-sm hover:opacity-95 transition"
                >
                  <Phone className="size-4" /> Call seller
                </a>
              )}
              {email && (
                <a
                  href={`mailto:${email}?subject=${encodeURIComponent("About " + product.title)}`}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-card border border-border rounded-2xl font-bold text-sm hover:bg-secondary transition"
                >
                  <Mail className="size-4" /> Email seller
                </a>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
