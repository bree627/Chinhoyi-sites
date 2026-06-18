import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, LockKeyhole, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — VeloMarket" },
      { name: "description", content: "Set a new password for your VeloMarket account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [hasRecoveryLink, setHasRecoveryLink] = useState(true);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    setHasRecoveryLink(hash.get("type") === "recovery" || hash.has("access_token"));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      window.setTimeout(() => navigate({ to: "/admin" }), 900);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background grid place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/auth" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>

        <div className="bg-card border border-border rounded-3xl p-7 shadow-xl shadow-brand/5">
          <div className="flex items-center gap-2 mb-5">
            <div className="size-9 bg-brand rounded-xl grid place-items-center">
              <ShoppingBag className="size-4 text-brand-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg tracking-tight">VeloMarket</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight">Set new password</h1>
          <p className="text-sm text-muted-foreground mt-1">Choose a new password, then you’ll go to the admin panel.</p>

          {!hasRecoveryLink && (
            <div className="mt-6 bg-warning/10 text-warning text-sm rounded-xl px-4 py-3">
              Open this page from the password reset email link.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New password</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                maxLength={72}
                className="mt-1.5 w-full h-11 px-4 rounded-2xl bg-secondary outline-none focus:ring-2 ring-brand/30 text-sm"
                placeholder="••••••••"
              />
            </div>

            {error && <div className="bg-destructive/10 text-destructive text-sm rounded-xl px-4 py-3">{error}</div>}
            {done && (
              <div className="bg-success/10 text-success text-sm rounded-xl px-4 py-3 inline-flex items-start gap-2">
                <CheckCircle2 className="size-4 mt-0.5 shrink-0" /> Password updated.
              </div>
            )}

            <button
              type="submit"
              disabled={busy || done || !hasRecoveryLink}
              className="w-full h-11 rounded-2xl bg-brand text-brand-foreground font-bold text-sm shadow-lg shadow-brand/20 inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <LockKeyhole className="size-4" />}
              Save password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}