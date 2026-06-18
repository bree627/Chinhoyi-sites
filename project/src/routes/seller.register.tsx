import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { ArrowLeft, Loader2, Upload, ShieldCheck, CheckCircle2, Clock } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/seller/register")({
  head: () => ({
    meta: [
      { title: "Become a seller — VeloMarket" },
      { name: "description", content: "Apply to sell on VeloMarket. Every seller is reviewed by our admin team." },
    ],
  }),
  component: SellerRegisterPage,
});

const applicationSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(5).max(30),
  bio: z.string().trim().min(20).max(500),
});

type SellerRow = {
  id: string;
  full_name: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  id_document_url: string | null;
  created_at: string;
};

function SellerRegisterPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [existing, setExisting] = useState<SellerRow | null>(null);
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/auth", search: { redirect: "/seller/register" } });
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("sellers")
        .select("id, full_name, status, id_document_url, created_at")
        .eq("user_id", user.id)
        .maybeSingle();
      setExisting((data as SellerRow | null) ?? null);
      if (data?.full_name) setFullName(data.full_name);
      setLoading(false);
    })();
  }, [user, authLoading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);

    const parsed = applicationSchema.safeParse({ full_name: fullName, phone, bio });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your input");
      return;
    }
    if (!idFile) {
      setError("Please upload a photo of your ID document");
      return;
    }
    if (idFile.size > 8 * 1024 * 1024) {
      setError("ID file must be under 8MB");
      return;
    }

    setSubmitting(true);
    try {
      const ext = idFile.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/id-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("seller-ids")
        .upload(path, idFile, { upsert: true });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("sellers").insert({
        user_id: user.id,
        full_name: parsed.data.full_name,
        email: user.email ?? "",
        phone: parsed.data.phone,
        bio: parsed.data.bio,
        id_document_url: path,
        status: "pending",
      });
      if (insErr) throw insErr;

      navigate({ to: "/seller/dashboard" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit application");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || loading) {
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
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="size-4" /> Back
        </Link>

        {existing ? (
          <StatusCard seller={existing} />
        ) : (
          <>
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand/10 rounded-full text-xs font-semibold text-brand mb-3">
                <ShieldCheck className="size-3.5" />
                Seller application
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Apply to sell on VeloMarket</h1>
              <p className="mt-2 text-muted-foreground text-pretty">
                Tell us a little about you and upload a valid ID. Our admin team reviews every application — usually within 24 hours.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-card border border-border rounded-3xl p-6 sm:p-7 space-y-5">
              <Field label="Full name">
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  maxLength={100}
                  className="w-full h-11 px-4 rounded-2xl bg-secondary outline-none focus:ring-2 ring-brand/30 text-sm"
                  placeholder="As it appears on your ID"
                />
              </Field>

              <Field label="Phone / WhatsApp">
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={30}
                  className="w-full h-11 px-4 rounded-2xl bg-secondary outline-none focus:ring-2 ring-brand/30 text-sm"
                  placeholder="+1 555 123 4567"
                />
              </Field>

              <Field label="About your shop" hint="20–500 characters. What do you sell? What makes it special?">
                <textarea
                  required
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={500}
                  rows={4}
                  className="w-full px-4 py-3 rounded-2xl bg-secondary outline-none focus:ring-2 ring-brand/30 text-sm resize-none"
                  placeholder="Handmade ceramics from my studio in Lisbon..."
                />
              </Field>

              <Field label="Government-issued ID" hint="Passport, national ID, or driver's license. JPG/PNG/PDF, max 8MB. Stored privately for admin review only.">
                <label className="flex items-center gap-3 h-14 px-4 rounded-2xl border-2 border-dashed border-border bg-secondary/50 cursor-pointer hover:border-brand/50 transition-colors">
                  <Upload className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">
                    {idFile ? idFile.name : "Tap to upload ID document"}
                  </span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setIdFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                </label>
              </Field>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm rounded-xl px-4 py-3">{error}</div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-2xl bg-brand text-brand-foreground font-bold text-sm shadow-lg shadow-brand/20 inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Submit application
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="text-[11px] text-muted-foreground mt-1.5">{hint}</p>}
    </div>
  );
}

function StatusCard({ seller }: { seller: SellerRow }) {
  const config = {
    pending: { Icon: Clock, tone: "bg-warning/10 text-warning", title: "Application under review", desc: "Our admin team is reviewing your application. You'll be notified once a decision is made — usually within 24 hours." },
    approved: { Icon: CheckCircle2, tone: "bg-success/10 text-success", title: "You're approved!", desc: "Welcome aboard. You can now list products on VeloMarket." },
    rejected: { Icon: ShieldCheck, tone: "bg-destructive/10 text-destructive", title: "Application not approved", desc: "Unfortunately your application didn't pass our review. You can contact support to learn more." },
    suspended: { Icon: ShieldCheck, tone: "bg-destructive/10 text-destructive", title: "Account suspended", desc: "Your seller account is currently suspended. Please contact support." },
  }[seller.status];
  const Icon = config.Icon;
  return (
    <div className="bg-card border border-border rounded-3xl p-7 text-center">
      <div className={`size-14 mx-auto rounded-2xl grid place-items-center mb-4 ${config.tone}`}>
        <Icon className="size-7" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">{config.title}</h1>
      <p className="mt-2 text-muted-foreground text-pretty">{config.desc}</p>
      <div className="mt-6">
        <Link
          to="/seller/dashboard"
          className="inline-flex items-center gap-1.5 px-5 h-11 rounded-2xl bg-foreground text-background font-bold text-sm"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
