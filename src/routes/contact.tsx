import { Helmet } from "react-helmet-async";
import { useState, type FormEvent } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Mail, Phone, MapPin, Clock, Send, Loader2, CheckCircle2 } from "lucide-react";
import { highlightTitle, useWebsitePage } from "@/lib/websiteContent";
import { api, ApiRequestError } from "@/lib/api";

const DETAIL_ICONS = [Mail, Phone, MapPin, Clock];

type ContactSections = {
  hero?: { eyebrow?: string; title?: string; titleHighlight?: string; description?: string };
  details?: { label: string; value: string }[];
};

export default function Page() {
  const { sections } = useWebsitePage<ContactSections>("contact");
  const hero = sections.hero ?? {};
  const details = sections.details ?? [];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api("/contact", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
        }),
      });
      setDone(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not send message.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Contact — Serve Humanity</title>
        <meta
          name="description"
          content="Get in touch with Serve Humanity. Email, phone or visit any of our chapter offices."
        />
        <meta property="og:title" content="Contact — Serve Humanity" />
        <meta property="og:url" content="/contact" />
        <link rel="canonical" href="/contact" />
      </Helmet>
      <SiteLayout>
        <PageHero
          eyebrow={hero.eyebrow || "Contact"}
          title={highlightTitle(hero.title || "Let's talk", hero.titleHighlight)}
          description={hero.description}
        />
        <section className="page-section grid items-stretch gap-6 lg:grid-cols-[1fr_1.2fr]">
          {/* LEFT COLUMN */}
          <div className="h-full [&>*]:h-full">
            <Reveal>
              <div className="flex h-full flex-col gap-4">
                {details.map((c, i) => {
                  const Icon = DETAIL_ICONS[i % DETAIL_ICONS.length];
                  return (
                    <div
                      key={c.label}
                      className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft"
                    >
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-brand-accent">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-widest text-brand-blue">
                          {c.label}
                        </div>
                        <div className="mt-0.5 font-medium">{c.value}</div>
                      </div>
                    </div>
                  );
                })}

                {/* Map — Taxila (fills remaining height) */}
                <div className="flex min-h-[280px] flex-1 flex-col overflow-hidden rounded-2xl border border-border shadow-soft">
                  <div className="relative min-h-[220px] flex-1">
                    <iframe
                      title="Serve Humanity HQ location — Taxila, Pakistan"
                      src="https://www.google.com/maps?q=Taxila,+Punjab,+Pakistan&z=13&output=embed"
                      className="absolute inset-0 h-full w-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      allowFullScreen
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 bg-card px-4 py-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-brand-accent" />
                      <div>
                        <p className="text-sm font-semibold">Serve Humanity HQ</p>
                        <p className="text-xs text-muted-foreground">Taxila · Pakistan</p>
                      </div>
                    </div>
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=Taxila,Punjab,Pakistan"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-brand-blue underline"
                    >
                      Open in Maps
                    </a>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* RIGHT COLUMN */}
          <div className="h-full [&>*]:h-full">
            <Reveal delay={1}>
              <form
                onSubmit={onSubmit}
                className="flex h-full flex-col rounded-3xl border border-border bg-card p-6 shadow-elevated md:p-8"
              >
                <h3 className="font-display text-2xl font-bold">Send us a message</h3>
                {done ? (
                  <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-sm text-emerald-800">
                    <div className="flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="h-4 w-4" /> Message sent
                    </div>
                    <p className="mt-1">
                      Thank you — we received your message and will reply within one business day.
                    </p>
                    <button
                      type="button"
                      className="mt-3 text-xs font-semibold underline"
                      onClick={() => setDone(false)}
                    >
                      Send another
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mt-6 grid flex-1 content-start gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-xs font-medium text-muted-foreground">Name</span>
                        <input
                          required
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none focus:border-brand-orange"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-medium text-muted-foreground">Email</span>
                        <input
                          required
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none focus:border-brand-orange"
                        />
                      </label>
                      <label className="block sm:col-span-2">
                        <span className="text-xs font-medium text-muted-foreground">Subject</span>
                        <input
                          required
                          type="text"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none focus:border-brand-orange"
                        />
                      </label>
                      <label className="block sm:col-span-2">
                        <span className="text-xs font-medium text-muted-foreground">Message</span>
                        <textarea
                          rows={5}
                          required
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none focus:border-brand-orange"
                        />
                      </label>
                    </div>
                    {error ? (
                      <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        {error}
                      </p>
                    ) : null}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-warm py-3.5 text-sm font-bold text-white shadow-warm transition hover:-translate-y-0.5 disabled:opacity-70"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                        </>
                      ) : (
                        <>
                          Send message{" "}
                          <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}
                    </button>
                  </>
                )}
              </form>
            </Reveal>
          </div>
        </section>
      </SiteLayout>
    </>
  );
}