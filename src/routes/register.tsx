import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/site/Logo";
import { Lock, Mail, User, Users, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { api, ApiRequestError, type AuthUser } from "@/lib/api";
import { chapterHomeForUser, isChapterAppUser, JOINABLE_TEAMS } from "@/lib/chapterRoles";

type ChapterOption = { _id: string; name: string; city?: string; status?: string };

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

export default function RegisterPage() {
  const { user, loading, register } = useAuth();
  const navigate = useNavigate();
  const [chapters, setChapters] = useState<ChapterOption[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [chapter, setChapter] = useState("");
  const [team, setTeam] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const token = localStorage.getItem("sh_token");
      const redirected = redirectForRole(user, token, navigate);
      if (!redirected) navigate("/");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setChaptersLoading(true);
      try {
        const res = await api<{ success: true; data: ChapterOption[] }>("/chapters?status=active");
        if (!cancelled) setChapters(res.data || []);
      } catch {
        if (!cancelled) setError("Unable to load chapters. Please refresh and try again.");
      } finally {
        if (!cancelled) setChaptersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (!chapter) {
      setError("Please select a chapter.");
      return;
    }
    if (!team) {
      setError("Please select a team.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        chapter,
        team,
      });
      if (result.pendingApproval) {
        setSuccessMsg(result.message);
        setPassword("");
        return;
      }
      navigate(chapterHomeForUser(result.user));
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : "Unable to register. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Register — Serve Humanity</title>
        <meta name="description" content="Create a chapter team account for Serve Humanity." />
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="relative min-h-screen overflow-hidden bg-background">
        <div className="pointer-events-none absolute inset-0 bg-mesh" />
        <div className="pointer-events-none absolute -left-24 top-24 h-96 w-96 rounded-full bg-brand-orange/30 blur-3xl animate-blob" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-[28rem] w-[28rem] rounded-full bg-brand-blue/25 blur-3xl animate-blob" />

        <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-6 py-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-elevated md:p-10"
          >
            <div className="flex justify-center">
              <Logo />
            </div>
            <h1 className="mt-6 text-center font-display text-2xl font-bold">Create account</h1>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              Select your chapter and team. After one approval from the president, a VP, or that
              team&apos;s cabinet head, you can sign in.
            </p>

            {successMsg ? (
              <div className="mt-8 space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
                <p className="text-sm font-medium text-emerald-900">{successMsg}</p>
                <p className="text-xs text-emerald-800/80">
                  The president, both vice presidents, and that team&apos;s cabinet head were notified.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-warm px-5 py-2.5 text-sm font-bold text-white shadow-warm"
                >
                  Go to sign in
                </Link>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-8 space-y-4">
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">
                    Chapter <span className="text-red-500">*</span>
                  </span>
                  <div className="relative mt-1">
                    <Users className="absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <select
                      required
                      value={chapter}
                      disabled={chaptersLoading}
                      onChange={(e) => setChapter(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-border bg-secondary py-3 pl-11 pr-4 text-sm outline-none focus:border-brand-orange disabled:opacity-70"
                    >
                      <option value="">
                        {chaptersLoading ? "Loading chapters…" : "Select chapter"}
                      </option>
                      {chapters.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                          {c.city ? ` — ${c.city}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">
                    Team <span className="text-red-500">*</span>
                  </span>
                  <div className="relative mt-1">
                    <select
                      required
                      value={team}
                      onChange={(e) => setTeam(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-border bg-secondary py-3 px-4 text-sm outline-none focus:border-brand-orange"
                    >
                      <option value="">Select team</option>
                      {JOINABLE_TEAMS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Full name</span>
                  <div className="relative mt-1">
                    <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-border bg-secondary py-3 pl-11 pr-4 text-sm outline-none focus:border-brand-orange"
                      placeholder="Your name"
                    />
                  </div>
                </label>

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
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
                      className="w-full rounded-xl border border-border bg-secondary py-3 pl-11 pr-4 text-sm outline-none focus:border-brand-orange"
                    />
                  </div>
                </label>

                {error ? (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting || chaptersLoading || !chapter || !team}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-warm py-3.5 text-sm font-bold text-white shadow-warm transition hover:-translate-y-0.5 disabled:opacity-70"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                    </>
                  ) : (
                    <>
                      Submit for approval{" "}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-brand-blue hover:underline">
                Sign in
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
