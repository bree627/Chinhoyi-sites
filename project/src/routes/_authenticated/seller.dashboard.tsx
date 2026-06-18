import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock, Loader2, LogOut, Package, ShieldAlert, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/seller/dashboard")({
  head: () => ({
    meta: [{ title: "Seller dashboard — VeloMarket" }],
  }),
  component: SellerDashboard,
});

type Seller = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: "pending" | "approved" | "rejected" | "suspended";
  bio: string | null;
  created_at: string;
};

function SellerDashboard() {
  const { user } = Route.useRouteContext();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("sellers")
        .select("id, full_name, email, phone, status, bio, created_at")
        .eq("user_id", user.id)
        .maybeSingle();
      setSeller((data as Seller | null) ?? null);
      setLoading(false);
    })();
  }, [user.id]);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
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

  if (!seller) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-4 py-10 text-center">
          <div className="bg-card border border-border rounded-3xl p-8">
            <div className="size-12 mx-auto rounded-2xl bg-brand/10 text-brand grid place-items-center mb-4">
              <Sparkles className="size-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Become a seller</h1>
            <p className="mt-2 text-muted-foreground">You haven't applied yet. Submit a seller application to start listing products.</p>
            <Link to="/seller/register" className="inline-flex items-center gap-1.5 px-5 h-11 mt-5 rounded-2xl bg-brand text-brand-foreground font-bold text-sm">
              Apply now
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const statusConfig = {
    pending: { Icon: Clock, label: "Pending review", tone: "bg-warning/10 text-warning" },
    approved: { Icon: CheckCircle2, label: "Approved", tone: "bg-success/10 text-success" },
    rejected: { Icon: ShieldAlert, label: "Rejected", tone: "bg-destructive/10 text-destructive" },
    suspended: { Icon: ShieldAlert, label: "Suspended", tone: "bg-destructive/10 text-destructive" },
  }[seller.status];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Marketplace
          </Link>
          <button onClick={signOut} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <LogOut className="size-4" /> Sign out
          </button>
        </div>

        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Hi, {seller.full_name.split(" ")[0]}</h1>
              <p className="text-sm text-muted-foreground mt-1">{seller.email}</p>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${statusConfig.tone}`}>
              <statusConfig.Icon className="size-3.5" />
              {statusConfig.label}
            </div>
          </div>

          {seller.status === "pending" && (
            <div className="mt-6 bg-warning/5 border border-warning/20 rounded-2xl p-4">
              <p className="text-sm">
                <span className="font-semibold">Your application is under review.</span>{" "}
                <span className="text-muted-foreground">Our admin team will verify your ID and shop details. You'll be able to list products once approved.</span>
              </p>
            </div>
          )}

          {seller.status === "approved" && (
            <div className="mt-6 grid sm:grid-cols-2 gap-3">
              <Link to="/seller/products" className="block">
                <DashCard icon={Package} title="My products" desc="Add and manage your listings." />
              </Link>
              <Link to="/seller/products/new" className="block">
                <DashCard icon={Sparkles} title="Add product" desc="List a new product on VeloMarket." />
              </Link>
            </div>
          )}

          {seller.status === "rejected" && (
            <div className="mt-6 bg-destructive/5 border border-destructive/20 rounded-2xl p-4 text-sm text-muted-foreground">
              Your application wasn't approved. Contact <a className="text-brand font-semibold" href="mailto:support@velomarket.app">support@velomarket.app</a> for details.
            </div>
          )}

          {seller.bio && (
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your shop</h3>
              <p className="mt-2 text-sm text-pretty">{seller.bio}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function DashCard({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <div className="bg-secondary rounded-2xl p-4 border border-border">
      <Icon className="size-5 text-brand mb-2" />
      <h4 className="font-bold text-sm">{title}</h4>
      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
    </div>
  );
}
