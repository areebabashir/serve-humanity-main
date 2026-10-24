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
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((e, i) => (
                <Reveal key={e.id} delay={i}>
                  <div className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-elevated">
                    <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-orange/20 blur-3xl transition-all group-hover:scale-125" />
                    <div className="relative">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-accent">
                        <Calendar className="h-3.5 w-3.5" /> {e.date}
                      </div>
                      <h3 className="mt-3 font-display text-xl font-bold">{e.title}</h3>
                      {e.chapterName ? (
                        <p className="mt-1 text-xs font-medium text-brand-blue">{e.chapterName} chapter</p>
                      ) : null}
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" /> {e.location}
                      </p>
                      <div className="mt-5 flex gap-2">
                        <div className="flex-1 rounded-2xl bg-secondary p-3">
                          <Clock className="h-3.5 w-3.5 text-brand-blue" />
                          <div className="mt-1 font-display font-bold">
                            {daysUntilEvent(e.dateIso, e.days)}d
                          </div>
                          <div className="text-[10px] uppercase text-muted-foreground">to go</div>
                        </div>
                        <div className="flex-1 rounded-2xl bg-secondary p-3">
                          <Users className="h-3.5 w-3.5 text-brand-accent" />
                          <div className="mt-1 font-display text-xs font-bold">
                            {e.capacity || "—"}
                          </div>
                          <div className="text-[10px] uppercase text-muted-foreground">capacity</div>
                        </div>
                      </div>
                      {isEventPast(e.dateIso) ? (
                        <div className="mt-4 w-full rounded-full border border-border bg-secondary py-2.5 text-center text-sm font-semibold text-muted-foreground">
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
                          className="mt-4 w-full rounded-full bg-gradient-warm py-2.5 text-sm font-semibold text-white shadow-warm transition hover:-translate-y-0.5"
                        >
                          Register
                        </button>
                      )}
                    </div>
                  </div>
                </Reveal>
              ))}
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
