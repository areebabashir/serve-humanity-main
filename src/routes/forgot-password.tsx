import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/site/Logo";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { api, ApiRequestError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      navigate(`/reset-password?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Unable to send reset code.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Forgot password — Serve Humanity</title>
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
            <h1 className="mt-6 text-center font-display text-2xl font-bold">Forgot password</h1>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              We&apos;ll email you a 6-digit reset code
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
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
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                  </>
                ) : (
                  "Send reset code"
                )}
              </button>

              <p className="text-center text-xs text-muted-foreground">
                <Link to="/login" className="font-semibold text-brand-blue hover:underline">
                  <ArrowLeft className="mr-1 inline h-3 w-3" />
                  Back to sign in
                </Link>
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  );
}
