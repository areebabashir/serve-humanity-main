import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Logo } from "@/components/site/Logo";
import { Lock, Loader2, Mail, KeyRound } from "lucide-react";
import { motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { api, ApiRequestError } from "@/lib/api";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(params.get("email") || "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const trimmedCode = code.replace(/\s+/g, "");
    if (!/^\d{6}$/.test(trimmedCode)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          code: trimmedCode,
          password,
        }),
      });
      navigate("/login", { replace: true, state: { resetOk: true } });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Unable to reset password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Reset password — Serve Humanity</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="relative min-h-screen overflow-hidden bg-background">
        <div className="pointer-events-none absolute inset-0 bg-mesh" />
        <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-elevated md:p-10"
          >
            <div className="flex justify-center">
              <Logo />
            </div>
            <h1 className="mt-6 text-center font-display text-2xl font-bold">Set new password</h1>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              Enter the code from your email
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              {params.get("email") ? (
                <p className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm">
                  We sent a 6-digit code to <strong>{params.get("email")}</strong> (if that account
                  exists). It expires in 30 minutes.
                </p>
              ) : null}

              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Email</span>
                <div className="relative mt-1">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-border bg-secondary py-3 pl-11 pr-4 text-sm outline-none focus:border-brand-orange"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Reset code</span>
                <div className="relative mt-1">
                  <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    pattern="\d{6}"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full rounded-xl border border-border bg-secondary py-3 pl-11 pr-4 text-sm tracking-[0.35em] outline-none focus:border-brand-orange"
                    placeholder="000000"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">New password</span>
                <div className="relative mt-1">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    required
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-border bg-secondary py-3 pl-11 pr-4 text-sm outline-none focus:border-brand-orange"
                  />
                </div>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Confirm password</span>
                <div className="relative mt-1">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    required
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full rounded-xl border border-border bg-secondary py-3 pl-11 pr-4 text-sm outline-none focus:border-brand-orange"
                  />
                </div>
              </label>

              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-warm py-3.5 text-sm font-bold text-white shadow-warm disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  "Update password"
                )}
              </button>

              <p className="text-center text-xs text-muted-foreground">
                <Link to="/forgot-password" className="font-semibold text-brand-blue hover:underline">
                  Resend code
                </Link>
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  );
}
