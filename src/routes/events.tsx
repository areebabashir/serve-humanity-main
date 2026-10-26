import { Helmet } from "react-helmet-async";
import { useEffect, useState, type FormEvent } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Calendar, MapPin, Clock, Users, Loader2 } from "lucide-react";
import { highlightTitle, useWebsitePage } from "@/lib/websiteContent";
import { api, ApiRequestError } from "@/lib/api";
import { daysUntilEvent, isEventPast } from "@/lib/eventCountdown";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowRight } from "lucide-react";

type EventsSections = {
  hero?: { eyebrow?: string; title?: string; titleHighlight?: string; description?: string };
};

type PublicEvent = {
  id: string;
  title: string;
  date: string;
  dateIso?: string | null;
  location: string;
  days: number;
  capacity: string;
  chapterName?: string;
};

export default function Page() {
  const { sections } = useWebsitePage<EventsSections>("events");
  const hero = sections.hero ?? {};
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<PublicEvent | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", note: "" });
  const [submitting, setSubmitting] = useState(false);
  const [doneMsg, setDoneMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api<{ success: true; data: PublicEvent[] }>("/website-events/public")
      .then((res) => {
        if (!cancelled) setEvents(res.data || []);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onRegister(e: FormEvent) {
    e.preventDefault();
    if (!active) return;
    setError("");
    setDoneMsg("");
    setSubmitting(true);
    try {
      const res = await api<{ success: true; message?: string }>(
        `/website-events/${active.id}/register`,
        {
          method: "POST",
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            note: form.note.trim(),
          }),
        },
      );
      setDoneMsg(res.message || "Registered successfully.");
      setForm({ name: "", email: "", phone: "", note: "" });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Events — Serve Humanity</title>
        <meta
          name="description"
          content="Upcoming humanitarian events, drives and camps you can join or support."
        />
        <meta property="og:title" content="Events — Serve Humanity" />
        <meta property="og:url" content="/events" />
        <link rel="canonical" href="/events" />
      </Helmet>
      <SiteLayout>
        <PageHero
          eyebrow={hero.eyebrow || "Events"}
          title={highlightTitle(hero.title || "Show up. Change lives.", hero.titleHighlight)}
          description={hero.description}
        />
        <section className="page-section">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading events…
            </div>
          ) : events.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No events published yet. Leadership can add them from Website Events, or chapter
              presidents from their chapter Events page.
            </p>
          ) : (
            <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
  {events.map((e, i) => {
    const past = isEventPast(e.dateIso);
    const days = daysUntilEvent(e.dateIso, e.days);

    return (
      <Reveal key={e.id} delay={Math.min(i * 0.08, 0.3)}>
        <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-orange/40 hover:shadow-elevated">
          {/* Top accent */}
          <div className="h-1.5 w-full bg-gradient-warm" />

          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-brand-orange/10 blur-3xl transition-transform duration-500 group-hover:scale-150" />

          <div className="relative flex flex-1 flex-col p-5 sm:p-6">
            {/* Date and status */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 rounded-full bg-brand-orange/10 px-3 py-2 text-xs font-bold text-brand-accent">
                <Calendar className="h-3.5 w-3.5" />
                {e.date}
              </div>

              <span
                className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                  past
                    ? "bg-secondary text-muted-foreground"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {past ? "Completed" : "Upcoming"}
              </span>
            </div>

            {/* Event details */}
            <h3 className="mt-5 font-display text-xl font-bold leading-snug transition-colors group-hover:text-brand-accent sm:text-2xl">
              {e.title}
            </h3>

            {e.chapterName && (
              <p className="mt-2 text-xs font-semibold text-brand-blue">
                {e.chapterName} Chapter
              </p>
            )}

            <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-muted-foreground">
              <MapPin className="mt-1 h-4 w-4 shrink-0 text-brand-accent" />
              <span>{e.location}</span>
            </p>

            {/* Countdown and capacity */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-secondary/80 p-4">
                <div className="flex items-center gap-2 text-brand-blue">
                  <Clock className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Countdown
                  </span>
                </div>

                <p className="mt-2 font-display text-2xl font-bold">
                  {past ? "—" : days}
                  {!past && (
                    <span className="ml-1 text-xs font-medium text-muted-foreground">
                      {days === 1 ? "day" : "days"}
                    </span>
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-secondary/80 p-4">
                <div className="flex items-center gap-2 text-brand-accent">
                  <Users className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Capacity
                  </span>
                </div>

                <p className="mt-2 truncate font-display text-lg font-bold">
                  {e.capacity || "Not specified"}
                </p>
              </div>
            </div>

            {/* Register button */}
            <div className="mt-auto pt-6">
              {past ? (
                <div className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-secondary py-3 text-sm font-semibold text-muted-foreground">
                  Event ended
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setActive(e);
                    setDoneMsg("");
                    setError("");
                  }}
                  className="group/btn flex w-full items-center justify-center gap-2 rounded-full bg-gradient-warm py-3.5 text-sm font-bold text-white shadow-warm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
                >
                  Register for event
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </button>
              )}
            </div>
          </div>
        </div>
      </Reveal>
    );
  })}
</div>
          )}
        </section>
      </SiteLayout>

      <Dialog
        open={!!active}
        onOpenChange={(open) => {
          if (!open) setActive(null);
        }}
      >
        <DialogContent className="max-w-md sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Register — {active?.title}
            </DialogTitle>
            <DialogDescription>
              {active?.date} · {active?.location}
              {active?.chapterName ? ` · ${active.chapterName}` : ""}
            </DialogDescription>
          </DialogHeader>
          {doneMsg ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
              {doneMsg}
            </p>
          ) : (
            <form onSubmit={onRegister} className="space-y-3">
              <label className="block text-sm">
                <span className="text-xs text-muted-foreground">Name</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 outline-none focus:border-brand-orange"
                />
              </label>
              <label className="block text-sm">
                <span className="text-xs text-muted-foreground">Email</span>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 outline-none focus:border-brand-orange"
                />
              </label>
              <label className="block text-sm">
                <span className="text-xs text-muted-foreground">Phone (optional)</span>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 outline-none focus:border-brand-orange"
                />
              </label>
              <label className="block text-sm">
                <span className="text-xs text-muted-foreground">Note (optional)</span>
                <textarea
                  rows={2}
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 outline-none focus:border-brand-orange"
                />
              </label>
              {error ? <p className="text-xs text-red-700">{error}</p> : null}
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-warm py-3 text-sm font-bold text-white shadow-warm disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                  </>
                ) : (
                  "Confirm registration"
                )}
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
