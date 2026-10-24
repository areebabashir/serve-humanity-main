import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/site/Logo";
import { Lock, Mail, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { ApiRequestError, type AuthUser } from "@/lib/api";
import { chapterHomeForUser, isChapterAppUser } from "@/lib/chapterRoles";

const CEO_DASHBOARD_URL = import.meta.env.VITE_CEO_DASHBOARD_URL || "http://localhost:5174";

function redirectForRole(user: AuthUser, token?: string | null, navigate?: (path: string) => void) {
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : "";
  const ceoBoardRoles = [
    "ceo",
    "founder",
    "cto",
    "coo",
    "bog_verification",
    "bog_operations",
    "bog_media",
    "bog_finance",
    "bog_documentation",
    "bog_it",
  ];
  if (ceoBoardRoles.includes(user.systemRole)) {
    window.location.href = `${CEO_DASHBOARD_URL}${tokenQuery}`;
    return true;
  }
  if (isChapterAppUser(user.systemRole)) {
    navigate?.(chapterHomeForUser(user));
    return true;
  }
  return false;
}

export default function Page() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const token = localStorage.getItem("sh_token");
      const redirected = redirectForRole(user, token, navigate);
      if (!redirected) navigate("/");
    }
  }, [user, loading, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const loggedIn = await login(email.trim(), password);
      const token = localStorage.getItem("sh_token");
      const redirected = redirectForRole(loggedIn, token, navigate);
      if (!redirected) navigate("/");
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : "Unable to sign in. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Login — Serve Humanity</title>
        <meta name="description" content="Sign in to the Serve Humanity management portal." />
        <meta property="og:title" content="Login \u2014 Serve Humanity" />
        <meta property="og:url" content="/login" />
        <meta name="robots" content="noindex" />
        <link rel="canonical" href="/login" />
      </Helmet>
      <div className="relative min-h-screen overflow-hidden bg-background">
        <div className="pointer-events-none absolute inset-0 bg-mesh" />
        <div className="pointer-events-none absolute -left-24 top-24 h-96 w-96 rounded-full bg-brand-orange/30 blur-3xl animate-blob" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-[28rem] w-[28rem] rounded-full bg-brand-blue/25 blur-3xl animate-blob" />

        <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-elevated md:p-10"
          >
            <div className="flex justify-center">
              <Logo />
            </div>
            <h1 className="mt-6 text-center font-display text-2xl font-bold">Welcome back</h1>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              Sign in to the management portal
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
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Password</span>
                <div className="relative mt-1">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    required
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-border bg-secondary py-3 pl-11 pr-4 text-sm outline-none focus:border-brand-orange"
                  />
                </div>
              </label>

              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-between text-xs">
                <label className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <input type="checkbox" className="rounded border-border" /> Remember me
                </label>
                <Link to="/forgot-password" className="font-semibold text-brand-blue hover:underline">
                  Forgot password?
                </Link>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-warm py-3.5 text-sm font-bold text-white shadow-warm transition hover:-translate-y-0.5 disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
                  </>
                ) : (
                  <>
                    Sign in{" "}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
            <div className="mt-6 space-y-2 text-center text-xs text-muted-foreground">
              <p>
                No account yet?{" "}
                <Link to="/register" className="font-semibold text-brand-blue hover:underline">
                  Register
                </Link>
              </p>
              <p>
                Need support?{" "}
                <Link to="/volunteer" className="font-semibold text-brand-blue hover:underline">
                  Request help
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
