import { Link } from "@tanstack/react-router";
import { Search, ShoppingBag, User, LayoutDashboard, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-role";

export function SiteHeader({ search, onSearchChange }: { search?: string; onSearchChange?: (v: string) => void }) {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="size-9 bg-brand rounded-xl grid place-items-center shadow-lg shadow-brand/20">
            <ShoppingBag className="size-4 text-brand-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-lg tracking-tight hidden sm:inline">VeloMarket</span>
        </Link>

        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search products, sellers..."
            value={search ?? ""}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full h-10 bg-secondary rounded-2xl pl-10 pr-4 text-sm outline-none focus:ring-2 ring-brand/30 transition-all"
          />
        </div>

        {isAdmin && (
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 h-10 px-3 sm:px-4 rounded-2xl bg-brand/10 text-brand text-xs font-bold uppercase tracking-wider shrink-0"
            aria-label="Admin"
          >
            <ShieldCheck className="size-4" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        )}

        {user ? (
          <Link
            to="/seller/dashboard"
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-2xl bg-secondary border border-border text-xs font-bold uppercase tracking-wider shrink-0"
          >
            <LayoutDashboard className="size-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        ) : (
          <>
            <Link
              to="/seller/register"
              className="hidden sm:inline-flex items-center gap-1.5 h-10 px-4 rounded-2xl bg-foreground text-background text-xs font-bold uppercase tracking-wider shrink-0"
            >
              Sell
            </Link>
            <Link
              to="/auth"
              aria-label="Sign in"
              className="sm:hidden size-10 rounded-full bg-secondary grid place-items-center border border-border shrink-0"
            >
              <User className="size-4 text-muted-foreground" />
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
