import { Helmet } from "react-helmet-async";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { highlightTitle } from "@/lib/websiteContent";
import { api, ApiRequestError } from "@/lib/api";

type ChapterOption = { _id?: string; id?: string; name: string; city?: string; status?: string };

type FormOptions = {
  occupations: string[];
  relationships: string[];
  caseTypes: string[];
};

const DEFAULT_OPTIONS: FormOptions = {
  occupations: [
    "Student",
    "Employee",
    "Business Owner",
    "Self-Employed",
    "Unemployed",
    "Other",
  ],
  relationships: [
    "Relative",
    "Friend",
    "Neighbor",
    "Colleague",
    "Community Member",
    "Other",
  ],
  caseTypes: ["Health", "Marriage", "Fee", "Ration", "Emergency", "Other"],
};

const emptyForm = {
  chapterId: "",
  verifierName: "",
  verifierCity: "",
  verifierPhone: "",
  verifierEmail: "",
  currentlyDoing: "",
  relationship: "",
  familyName: "",
  familyCity: "",
  familyPhone: "",
  caseType: "",
  helpNeeded: "",
  helpNeededWithinDays: "",
};

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={className || "block"}>
      <span className="text-xs font-medium text-muted-foreground">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none focus:border-brand-orange disabled:opacity-70";

const NEED_SUPPORT_HERO = {
  eyebrow: "Need support",
  title: "Request help for a deserving family",
  titleHighlight: "deserving family",
  description:
    "If you or a family needs support, fill this form. Choose a chapter — it goes straight to that chapter’s president, vice president, and documentation cabinet.",
};

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Need Support — Serve Humanity</title>
        <meta
          name="description"
          content="Request support for a deserving family. Choose your chapter so the president, vice president, and documentation team can review it."
        />
        <meta property="og:title" content="Need Support — Serve Humanity" />
        <meta property="og:url" content="/volunteer" />
        <link rel="canonical" href="/volunteer" />
      </Helmet>
      <CaseRegistrationPage />
    </>
  );
}

function CaseRegistrationPage() {
  const [chapters, setChapters] = useState<ChapterOption[]>([]);
  const [options, setOptions] = useState<FormOptions>(DEFAULT_OPTIONS);
  const [form, setForm] = useState(emptyForm);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingMeta(true);
      try {
        const [chRes, optRes] = await Promise.all([
          api<{ success: true; data: ChapterOption[] }>("/chapters/public"),
          api<{ success: true; data: FormOptions }>("/case-referrals/options").catch(() => null),
        ]);
        if (cancelled) return;
        setChapters(
          (chRes.data || [])
            .map((c) => ({
              ...c,
              _id: c._id || c.id || "",
            }))
            .filter((c) => c._id && c.status !== "inactive"),
        );
        if (optRes?.data) setOptions(optRes.data);
      } catch {
        if (!cancelled) setError("Unable to load chapters. Please refresh and try again.");
      } finally {
        if (!cancelled) setLoadingMeta(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function setField<K extends keyof typeof emptyForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api("/case-referrals", {
        method: "POST",
        body: JSON.stringify({
          chapterId: form.chapterId,
          verifierName: form.verifierName.trim(),
          verifierCity: form.verifierCity.trim(),
          verifierPhone: form.verifierPhone.trim(),
          verifierEmail: form.verifierEmail.trim(),
          currentlyDoing: form.currentlyDoing,
          relationship: form.relationship,
          familyName: form.familyName.trim(),
          familyCity: form.familyCity.trim(),
          familyPhone: form.familyPhone.trim(),
          caseType: form.caseType,
          helpNeeded: form.helpNeeded.trim(),
          helpNeededWithinDays: Number(form.helpNeededWithinDays),
        }),
      });
      setDone(true);
      setForm(emptyForm);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Could not submit registration. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SiteLayout>
      <PageHero
        eyebrow={NEED_SUPPORT_HERO.eyebrow}
        title={highlightTitle(NEED_SUPPORT_HERO.title, NEED_SUPPORT_HERO.titleHighlight)}
        description={NEED_SUPPORT_HERO.description}
      />

      <section className="page-section">
        <Reveal>
          {done ? (
            <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-8 text-center shadow-elevated md:p-10">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="mt-5 font-display text-2xl font-bold">Request received</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Thank you. The selected chapter’s president, vice president, and documentation team
                have been notified and can follow up.
              </p>
              <button
                type="button"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-warm px-6 py-3 text-sm font-bold text-white shadow-warm"
                onClick={() => setDone(false)}
              >
                Submit another request
              </button>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-6 shadow-elevated md:p-8"
            >
              <h2 className="font-display text-2xl font-bold">Request support</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Fill both sections below. All fields marked * are required.
              </p>

              <div className="mt-6">
                <Field label="Chapter" required>
                  <select
                    required
                    disabled={loadingMeta}
                    value={form.chapterId}
                    onChange={(e) => setField("chapterId", e.target.value)}
                    className={inputClass}
                  >
                    <option value="">
                      {loadingMeta ? "Loading chapters…" : "Select chapter"}
                    </option>
                    {chapters.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                        {c.city ? ` — ${c.city}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="mt-8 border-t border-border pt-6">
                <h3 className="font-display text-lg font-bold">Reference / Verifier Details</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  The reference/verifier is a single person who will provide their own information.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Name" required>
                    <input
                      required
                      value={form.verifierName}
                      onChange={(e) => setField("verifierName", e.target.value)}
                      className={inputClass}
                      placeholder="Full name"
                    />
                  </Field>
                  <Field label="City" required>
                    <input
                      required
                      value={form.verifierCity}
                      onChange={(e) => setField("verifierCity", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Phone Number" required>
                    <input
                      required
                      type="tel"
                      value={form.verifierPhone}
                      onChange={(e) => setField("verifierPhone", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Email" required>
                    <input
                      required
                      type="email"
                      autoComplete="email"
                      value={form.verifierEmail}
                      onChange={(e) => setField("verifierEmail", e.target.value)}
                      className={inputClass}
                      placeholder="We'll email you when verified"
                    />
                  </Field>
                  <Field label="Currently Doing" required>
                    <select
                      required
                      value={form.currentlyDoing}
                      onChange={(e) => setField("currentlyDoing", e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select…</option>
                      {options.occupations.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Relationship with the Deserving Family" required className="sm:col-span-2">
                    <select
                      required
                      value={form.relationship}
                      onChange={(e) => setField("relationship", e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select…</option>
                      {options.relationships.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>

              <div className="mt-8 border-t border-border pt-6">
                <h3 className="font-display text-lg font-bold">Deserving Family / Case Details</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  For patient cases and other assistance, collect details of the head of the deserving
                  family.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Name" required>
                    <input
                      required
                      value={form.familyName}
                      onChange={(e) => setField("familyName", e.target.value)}
                      className={inputClass}
                      placeholder="Head of family"
                    />
                  </Field>
                  <Field label="City" required>
                    <input
                      required
                      value={form.familyCity}
                      onChange={(e) => setField("familyCity", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Contact Number" required>
                    <input
                      required
                      type="tel"
                      value={form.familyPhone}
                      onChange={(e) => setField("familyPhone", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Case Type" required>
                    <select
                      required
                      value={form.caseType}
                      onChange={(e) => setField("caseType", e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select…</option>
                      {options.caseTypes.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Type of Help Needed" required className="sm:col-span-2">
                    <textarea
                      required
                      rows={3}
                      value={form.helpNeeded}
                      onChange={(e) => setField("helpNeeded", e.target.value)}
                      className={inputClass}
                      placeholder="Describe the help needed"
                    />
                  </Field>
                  <Field label="Help Needed Within (Days)" required>
                    <input
                      required
                      type="number"
                      min={1}
                      step={1}
                      value={form.helpNeededWithinDays}
                      onChange={(e) => setField("helpNeededWithinDays", e.target.value)}
                      className={inputClass}
                      placeholder="e.g. 7"
                    />
                  </Field>
                </div>
              </div>

              {error ? (
                <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting || loadingMeta || !form.chapterId}
                className="mt-8 group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-warm py-3.5 text-sm font-bold text-white shadow-warm transition hover:-translate-y-0.5 disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                  </>
                ) : (
                  <>
                    Submit request
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          )}
        </Reveal>
      </section>
    </SiteLayout>
  );
}
