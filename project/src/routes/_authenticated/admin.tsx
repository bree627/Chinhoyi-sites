import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Loader2,
  Package,
  Users,
  Eye,
  FileText,
  Trash2,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-role";
import { formatPrice } from "@/lib/marketplace";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — VeloMarket" }] }),
  component: AdminPage,
});

type SellerRow = {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  bio: string | null;
  status: "pending" | "approved" | "rejected" | "suspended";
  id_document_url: string | null;
  verified: boolean;
  created_at: string;
};

type ProductRow = {
  id: string;
  title: string;
  price: number;
  available: boolean;
  featured: boolean;
  created_at: string;
  seller: { full_name: string } | null;
};

function AdminPage() {
  const { isAdmin, loading } = useIsAdmin();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"sellers" | "products">("sellers");
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  async function claimAdmin() {
    setClaiming(true);
    setClaimError(null);
    const { data, error } = await supabase.rpc("claim_admin_if_none");
    setClaiming(false);
    if (error) {
      setClaimError(error.message);
      return;
    }
    if (data === true) {
      window.location.reload();
    } else {
      setClaimError("An admin already exists. Ask them to grant you access.");
    }
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

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-lg px-4 py-12 text-center">
          <div className="bg-card border border-border rounded-3xl p-8">
            <div className="size-12 mx-auto rounded-2xl bg-brand/10 text-brand grid place-items-center mb-4">
              <ShieldCheck className="size-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Admin access</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              No admin exists yet. The first person to claim this role becomes the platform administrator.
            </p>
            <button
              onClick={claimAdmin}
              disabled={claiming}
              className="mt-5 w-full h-11 rounded-2xl bg-brand text-brand-foreground font-bold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {claiming && <Loader2 className="size-4 animate-spin" />}
              Claim admin role
            </button>
            {claimError && (
              <div className="mt-3 text-sm text-destructive">{claimError}</div>
            )}
            <button
              onClick={() => navigate({ to: "/" })}
              className="mt-3 text-xs text-muted-foreground hover:text-foreground"
            >
              Back to marketplace
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Marketplace
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-bold">
            <ShieldCheck className="size-3.5" /> Admin
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Review applications, approve sellers and manage listings.</p>
        </div>

        <div className="inline-flex bg-secondary rounded-2xl p-1 gap-1">
          <TabButton active={tab === "sellers"} onClick={() => setTab("sellers")} icon={Users} label="Sellers" />
          <TabButton active={tab === "products"} onClick={() => setTab("products")} icon={Package} label="Products" />
        </div>

        {tab === "sellers" ? <SellersPanel /> : <ProductsPanel />}
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-4 h-9 rounded-xl text-sm font-bold transition-colors ${
        active ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}

function SellersPanel() {
  const [sellers, setSellers] = useState<SellerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("sellers")
      .select("id, user_id, full_name, email, phone, bio, status, id_document_url, verified, created_at")
      .order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setSellers((data as SellerRow[] | null) ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: string, status: SellerRow["status"]) {
    await supabase.from("sellers").update({ status, verified: status === "approved" }).eq("id", id);
    load();
  }

  async function viewId(path: string) {
    const { data } = await supabase.storage.from("seller-ids").createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 h-8 rounded-full text-xs font-bold capitalize ${
              filter === f ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : sellers.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground bg-card border border-border rounded-3xl">
          No sellers match this filter.
        </div>
      ) : (
        <div className="space-y-3">
          {sellers.map((s) => (
            <div key={s.id} className="bg-card border border-border rounded-2xl p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold truncate">{s.full_name}</h3>
                    <StatusPill status={s.status} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 break-all">
                    {s.email} {s.phone && <>· {s.phone}</>}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {s.id_document_url && (
                    <button
                      onClick={() => viewId(s.id_document_url!)}
                      className="inline-flex items-center gap-1 px-3 h-8 rounded-xl bg-secondary text-xs font-bold"
                    >
                      <FileText className="size-3.5" /> ID
                    </button>
                  )}
                  {s.status !== "approved" && (
                    <button
                      onClick={() => setStatus(s.id, "approved")}
                      className="inline-flex items-center gap-1 px-3 h-8 rounded-xl bg-success text-success-foreground text-xs font-bold"
                    >
                      <CheckCircle2 className="size-3.5" /> Approve
                    </button>
                  )}
                  {s.status !== "rejected" && (
                    <button
                      onClick={() => setStatus(s.id, "rejected")}
                      className="inline-flex items-center gap-1 px-3 h-8 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold"
                    >
                      <XCircle className="size-3.5" /> Reject
                    </button>
                  )}
                </div>
              </div>
              {s.bio && <p className="mt-3 text-sm text-pretty">{s.bio}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: SellerRow["status"] }) {
  const tones: Record<SellerRow["status"], string> = {
    pending: "bg-warning/10 text-warning",
    approved: "bg-success/10 text-success",
    rejected: "bg-destructive/10 text-destructive",
    suspended: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${tones[status]}`}>
      {status}
    </span>
  );
}

function ProductsPanel() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("id, title, price, available, featured, created_at, seller:sellers(full_name)")
      .order("created_at", { ascending: false })
      .limit(100);
    setProducts((data as unknown as ProductRow[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleFeatured(p: ProductRow) {
    await supabase.from("products").update({ featured: !p.featured }).eq("id", p.id);
    load();
  }

  async function toggleAvailable(p: ProductRow) {
    await supabase.from("products").update({ available: !p.available }).eq("id", p.id);
    load();
  }

  async function remove(p: ProductRow) {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    await supabase.from("products").delete().eq("id", p.id);
    load();
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-16">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (products.length === 0) {
    return (
      <div className="text-center py-16 text-sm text-muted-foreground bg-card border border-border rounded-3xl">
        No products yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {products.map((p) => (
        <div key={p.id} className="bg-card border border-border rounded-2xl p-4 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold truncate">{p.title}</h3>
              {p.featured && <span className="text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent px-2 py-0.5 rounded-full">Featured</span>}
              {!p.available && <span className="text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Hidden</span>}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {formatPrice(p.price)} · {p.seller?.full_name ?? "Unknown seller"}
            </div>
          </div>
          <div className="flex gap-1.5 shrink-0 flex-wrap">
            <Link
              to="/product/$id"
              params={{ id: p.id }}
              className="inline-flex items-center gap-1 px-3 h-8 rounded-xl bg-secondary text-xs font-bold"
            >
              <Eye className="size-3.5" /> View
            </Link>
            <button
              onClick={() => toggleFeatured(p)}
              className={`px-3 h-8 rounded-xl text-xs font-bold ${p.featured ? "bg-accent text-accent-foreground" : "bg-secondary"}`}
            >
              {p.featured ? "Unfeature" : "Feature"}
            </button>
            <button
              onClick={() => toggleAvailable(p)}
              className="px-3 h-8 rounded-xl bg-secondary text-xs font-bold"
            >
              {p.available ? "Hide" : "Show"}
            </button>
            <button
              onClick={() => remove(p)}
              className="inline-flex items-center gap-1 px-3 h-8 rounded-xl bg-destructive/10 text-destructive text-xs font-bold"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
