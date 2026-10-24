import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { Building2, Check, Copy, Heart, Loader2, MapPin } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { highlightTitle, readOfflineCache, useWebsitePage, writeOfflineCache } from "@/lib/websiteContent";

type DonateSections = {
  hero?: { eyebrow?: string; title?: string; titleHighlight?: string; description?: string };
  note?: string;
};

type DonationAccount = {
  bankName?: string;
  accountTitle?: string;
  accountNumber?: string;
  iban?: string;
  note?: string;
};

type PublicChapter = {
  id: string;
  name: string;
  city: string;
  imageUrl?: string;
  president: string;
  members?: number;
  donationAccounts?: DonationAccount[];
};

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Donate — Serve Humanity</title>
        <meta
          name="description"
          content="Choose a Serve Humanity chapter and transfer your donation to that chapter’s official bank account."
        />
        <meta property="og:title" content="Donate — Serve Humanity" />
        <meta property="og:url" content="/donate" />
        <link rel="canonical" href="/donate" />
      </Helmet>
      <DonatePage />
    </>
  );
}

function DonatePage() {
  const { sections, loading: heroLoading } = useWebsitePage<DonateSections>("donate");
  const hero = sections.hero ?? {};
  const [chapters, setChapters] = useState<PublicChapter[]>(
    () => readOfflineCache<PublicChapter[]>("public:chapters") || [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PublicChapter | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api<{ success: true; data: PublicChapter[] }>("/chapters/public")
      .then((res) => {
        if (cancelled) return;
        const list = res.data ?? [];
        writeOfflineCache("public:chapters", list);
        setChapters(list);
      })
      .catch((err) => {
        if (cancelled) return;
        const cached = readOfflineCache<PublicChapter[]>("public:chapters");
        if (cached?.length) {
          setChapters(cached);
        } else {
          setError(err instanceof Error ? err.message : "Failed to load chapters");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function copyValue(key: string, value: string) {
    const text = String(value || "").trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      /* ignore */
    }
  }

  const busy = loading || heroLoading;
  const accounts = selected?.donationAccounts || [];

  return (
    <SiteLayout>
      {heroLoading ? (
        <section className="relative overflow-hidden pt-32 pb-10 md:pt-40">
          <div className="pointer-events-none absolute inset-0 bg-mesh opacity-70" />
          <div className="container-page relative mx-auto max-w-3xl animate-pulse text-center">
            <div className="mx-auto h-7 w-32 rounded-full bg-brand-orange/15" />
            <div className="mx-auto mt-6 h-14 w-72 rounded-2xl bg-black/10" />
          </div>
        </section>
      ) : (
        <PageHero
          eyebrow={hero.eyebrow || "Donate"}
          title={highlightTitle(hero.title || "Choose a chapter to support", hero.titleHighlight)}
          description={
            hero.description ||
            "Pick your city chapter. Account details open in a popup — transfer directly to that chapter’s official bank account."
          }
        />
      )}

        <section className="page-section">
        {busy ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading chapters…
          </div>
        ) : error ? (
          <p className="py-16 text-center text-sm text-destructive">{error}</p>
        ) : chapters.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No active chapters yet. Chapters will appear here when they are live.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {chapters.map((c, i) => (
              <Reveal key={c.id} delay={i % 6}>
                <button
                  type="button"
                  onClick={() => setSelected(c)}
                  className="group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-border bg-card text-left shadow-soft transition-all hover:-translate-y-1 hover:border-brand-orange/40 hover:shadow-elevated"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
                    {c.imageUrl ? (
                      <img
                        src={c.imageUrl}
                        alt={`${c.city} chapter`}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-cool text-white/80">
                        <MapPin className="h-10 w-10 opacity-70" />
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  </div>
                  <div className="relative flex flex-1 flex-col p-6">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-accent">
                      <MapPin className="h-3.5 w-3.5" /> Chapter
                    </div>
                    <h3 className="mt-2 font-display text-2xl font-bold">{c.city}</h3>
                    {c.name && c.name !== c.city ? (
                      <p className="text-xs text-muted-foreground">{c.name}</p>
                    ) : null}
                    <p className="mt-1 text-sm text-muted-foreground">
                      Led by <b className="text-foreground">{c.president}</b>
                    </p>
                    <p className="mt-2 text-xs font-semibold text-brand-blue">
                      {Number(c.members) || 0} member{(Number(c.members) || 0) === 1 ? "" : "s"}
                    </p>
                    <div className="mt-auto pt-5">
                      <span className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-warm px-5 py-3 text-sm font-bold text-white shadow-warm transition group-hover:-translate-y-0.5">
                        <Heart className="h-4 w-4 fill-white" />
                        Donate now
                      </span>
                    </div>
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg overflow-hidden border-border sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {selected?.city || "Chapter"} — bank accounts
            </DialogTitle>
            <DialogDescription>
              Transfer your donation to one of the official accounts below. No online payment — bank
              transfer only.
            </DialogDescription>
          </DialogHeader>

          {accounts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-secondary/40 p-5 text-sm text-muted-foreground">
              This chapter has not published bank account details yet. Please check back soon or
              contact the chapter president.
            </div>
          ) : (
            <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
              {accounts.map((bank, idx) => {
                const copyId = `${selected?.id}-${idx}`;
                return (
                  <div
                    key={copyId}
                    className="rounded-2xl border border-border bg-secondary/60 p-4"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-blue">
                      <Building2 className="h-3.5 w-3.5" />
                      {bank.bankName || `Account ${idx + 1}`}
                    </div>
                    <dl className="mt-4 space-y-3 text-sm">
                      <div>
                        <dt className="text-xs text-muted-foreground">Account title</dt>
                        <dd className="mt-0.5 font-semibold text-foreground">
                          {bank.accountTitle || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Account number</dt>
                        <dd className="mt-1 flex items-center gap-2">
                          <span className="font-display text-xl font-bold tracking-wide text-brand-blue">
                            {bank.accountNumber || "—"}
                          </span>
                          {bank.accountNumber ? (
                            <button
                              type="button"
                              onClick={() => void copyValue(copyId, bank.accountNumber || "")}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:border-brand-orange hover:text-brand-orange"
                              aria-label="Copy account number"
                            >
                              {copiedKey === copyId ? (
                                <Check className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          ) : null}
                        </dd>
                      </div>
                      {bank.iban ? (
                        <div>
                          <dt className="text-xs text-muted-foreground">IBAN</dt>
                          <dd className="mt-0.5 break-all font-medium text-foreground">{bank.iban}</dd>
                        </div>
                      ) : null}
                      {bank.note ? (
                        <p className="text-xs leading-relaxed text-muted-foreground">{bank.note}</p>
                      ) : null}
                    </dl>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SiteLayout>
  );
}
