import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import type { Product } from "@/lib/marketplace";
import { formatPrice } from "@/lib/marketplace";

export function ProductCard({ product, featured = false }: { product: Product; featured?: boolean }) {
  const image = product.images?.[0];

  if (featured) {
    return (
      <Link
        to="/product/$id"
        params={{ id: product.id }}
        className="block bg-card rounded-3xl overflow-hidden border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
      >
        <div className="w-full aspect-[4/3] bg-secondary overflow-hidden">
          {image && (
            <img src={image} alt={product.title} loading="lazy"
              className="w-full h-full object-cover" />
          )}
        </div>
        <div className="p-4">
          <div className="flex justify-between items-start gap-3">
            <div className="min-w-0">
              {product.category && (
                <p className="text-xs font-bold text-accent uppercase tracking-wider mb-1">
                  {product.category.name}
                </p>
              )}
              <h3 className="font-bold text-lg leading-tight truncate">{product.title}</h3>
            </div>
            <div className="bg-secondary px-3 py-1 rounded-lg border border-border shrink-0">
              <span className="font-bold text-brand">{formatPrice(product.price)}</span>
            </div>
          </div>
          {product.seller && (
            <div className="mt-4 flex items-center gap-2">
              {product.seller.avatar_url ? (
                <img src={product.seller.avatar_url} alt="" className="size-6 rounded-full object-cover" />
              ) : (
                <div className="size-6 rounded-full bg-secondary" />
              )}
              <span className="text-xs text-muted-foreground font-medium min-w-0 truncate">
                Sold by <span className="text-foreground">{product.seller.full_name}</span>
              </span>
              {product.seller.verified && (
                <div className="ml-auto flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="size-3 text-success" />
                  <span className="text-[10px] font-bold text-success uppercase">Verified</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="group block"
    >
      <div className="w-full aspect-square bg-secondary rounded-2xl overflow-hidden border border-border">
        {image && (
          <img src={image} alt={product.title} loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        )}
      </div>
      <div className="mt-3 px-1">
        {product.category && (
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
            {product.category.name}
          </p>
        )}
        <h4 className="font-semibold text-sm leading-tight truncate">{product.title}</h4>
        <p className="text-sm font-bold text-brand mt-1">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}
