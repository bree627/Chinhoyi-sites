import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ArrowLeft, Loader2, MailCheck, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — VeloMarket" },
      { name: "description", content: "Sign in or create an account to start selling on VeloMarket." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      const dest = search.redirect ?? "/";
      // Use window.location for full reload to redirect param (which is href)
      if (dest.startsWith("http") || dest.startsWith("/")) {
        window.location.href = dest;
      } else {
        navigate({ to: "/" });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function handlePasswordReset() {
    setError(null);
    setResetSent(false);
    if (!email) {
      setError("Enter your email first, then tap Reset password.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send reset email");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background grid place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="size-4" /> Back to marketplace
        </Link>

        <div className="bg-card border border-border rounded-3xl p-7 shadow-xl shadow-brand/5">
          <div className="flex items-center gap-2 mb-5">
            <div className="size-9 bg-brand rounded-xl grid place-items-center">
              <ShoppingBag className="size-4 text-brand-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg tracking-tight">VeloMarket</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signin" ? "Sign in to manage your products and orders." : "Join VeloMarket to start selling."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full name</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  className="mt-1.5 w-full h-11 px-4 rounded-2xl bg-secondary outline-none focus:ring-2 ring-brand/30 text-sm"
                  placeholder="Jane Doe"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
                className="mt-1.5 w-full h-11 px-4 rounded-2xl bg-secondary outline-none focus:ring-2 ring-brand/30 text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
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
              <p className="text-[11px] text-muted-foreground mt-1.5">Minimum 8 characters.</p>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm rounded-xl px-4 py-3">{error}</div>
            )}

            {resetSent && (
              <div className="bg-success/10 text-success text-sm rounded-xl px-4 py-3 inline-flex items-start gap-2">
                <MailCheck className="size-4 mt-0.5 shrink-0" /> Check your email for a secure password reset link.
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full h-11 rounded-2xl bg-brand text-brand-foreground font-bold text-sm shadow-lg shadow-brand/20 inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <div className="space-y-2">
                <button onClick={handlePasswordReset} disabled={busy} className="text-brand font-semibold hover:underline disabled:opacity-60">
                  Reset password
                </button>
                <div>
                  New here?{" "}
                  <button onClick={() => { setMode("signup"); setError(null); setResetSent(false); }} className="text-brand font-semibold hover:underline">
                    Create an account
                  </button>
                </div>
              </div>
            ) : (
              <>
                Already have an account?{" "}
                <button onClick={() => { setMode("signin"); setError(null); setResetSent(false); }} className="text-brand font-semibold hover:underline">
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
