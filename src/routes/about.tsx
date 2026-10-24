import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import {
  Heart,
  Shield,
  Eye,
  Handshake,
  Lightbulb,
  Globe2,
  ArrowRight,
  Utensils,
  GraduationCap,
  Stethoscope,
  LifeBuoy,
  Baby,
  Droplets,
  Quote,
} from "lucide-react";
import { highlightTitle, useWebsitePage } from "@/lib/websiteContent";

const VALUE_ICONS = [Heart, Shield, Eye, Handshake, Lightbulb, Globe2];
const PROGRAM_ICONS = [Utensils, GraduationCap, Stethoscope, LifeBuoy, Baby, Heart, Droplets, Lightbulb];

type MessageBlock = {
  eyebrow?: string;
  name?: string;
  role?: string;
  message?: string;
  imageUrl?: string;
};

type AboutSections = {
  hero?: { eyebrow?: string; title?: string; titleHighlight?: string; description?: string };
  story?: { title?: string; paragraphs?: string[]; cta?: string; ctaLink?: string };
  values?: { title: string; body: string }[];
  founder?: MessageBlock;
  ceo?: MessageBlock;
  programs?: {
    eyebrow?: string;
    title?: string;
    titleHighlight?: string;
    description?: string;
    items?: { title: string; body: string; stat: string }[];
  };
};

function MessageSection({
  block,
  imageLeft,
  fallback,
}: {
  block: MessageBlock;
  imageLeft: boolean;
  fallback: { eyebrow: string; name: string; role: string; message: string };
}) {
  const eyebrow = block.eyebrow || fallback.eyebrow;
  const name = block.name || fallback.name;
  const role = block.role || fallback.role;
  const message = block.message || fallback.message;
  const imageUrl = block.imageUrl || "";

  return (
    <section className="page-section !pb-12 md:!pb-16">
      <div
        className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-14 ${
          imageLeft ? "" : "[&>*:first-child]:lg:order-2 [&>*:last-child]:lg:order-1"
        }`}
      >
        <Reveal>
          <div className="relative mx-auto w-full max-w-md lg:mx-0">
            <div className="absolute -inset-3 rounded-[2rem] bg-gradient-warm opacity-40 blur-md" />
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] border border-border bg-secondary shadow-elevated">
              {imageUrl ? (
                <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center bg-gradient-to-br from-brand-orange/20 to-brand-blue/20 font-display text-6xl font-bold text-brand-orange">
                  {name
                    .split(" ")
                    .map((s) => s[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </Reveal>

        <Reveal delay={1}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-accent">{eyebrow}</p>
          <Quote className="mt-4 h-8 w-8 text-brand-orange/70" />
          <blockquote className="mt-3 font-display text-xl font-semibold leading-relaxed text-foreground md:text-2xl">
            “{message}”
          </blockquote>
          <div className="mt-6 border-t border-border pt-5">
            <div className="font-display text-lg font-bold text-foreground">{name}</div>
            <div className="text-sm font-medium text-brand-blue">{role}</div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function Page() {
  const { sections } = useWebsitePage<AboutSections>("about");
  const hero = sections.hero ?? {};
  const story = sections.story ?? {};
  const values = sections.values ?? [];
  const founder = sections.founder ?? {};
  const ceo = sections.ceo ?? {};
  const programs = sections.programs ?? {};
  const programItems = programs.items ?? [];

  useEffect(() => {
    if (window.location.hash === "#programs") {
      const el = document.getElementById("programs");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [programItems.length]);

  return (
    <>
      <Helmet>
        <title>About Us — Serve Humanity</title>
        <meta
          name="description"
          content="Our story, founder & CEO messages, values, and the programs that serve communities."
        />
        <meta property="og:title" content="About Us — Serve Humanity" />
        <meta property="og:url" content="/about" />
        <link rel="canonical" href="/about" />
      </Helmet>
      <SiteLayout>
        <PageHero
          eyebrow={hero.eyebrow || "About us"}
          title={highlightTitle(hero.title || "Ten years of showing up", hero.titleHighlight)}
          description={hero.description}
        />

        <section className="page-section !pb-12 md:!pb-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <h2 className="font-display text-3xl font-bold md:text-4xl">{story.title || "Our story"}</h2>
              {(story.paragraphs ?? []).map((p) => (
                <p key={p.slice(0, 40)} className="mt-4 text-muted-foreground">
                  {p}
                </p>
              ))}
              <Link
                to={story.ctaLink || "/team"}
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue"
              >
                {story.cta || "Meet our team"} <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>
            <Reveal delay={1}>
              <div className="grid grid-cols-2 gap-4">
                {values.map((c, i) => {
                  const Icon = VALUE_ICONS[i % VALUE_ICONS.length];
                  return (
                    <Reveal
                      key={c.title}
                      delay={i}
                      className="rounded-2xl border border-border bg-card p-5 shadow-soft"
                    >
                      <Icon className="h-6 w-6 text-brand-accent" />
                      <div className="mt-3 font-display text-lg font-bold">{c.title}</div>
                      <div className="text-xs text-muted-foreground">{c.body}</div>
                    </Reveal>
                  );
                })}
              </div>
            </Reveal>
          </div>
        </section>

        <MessageSection
          block={founder}
          imageLeft
          fallback={{
            eyebrow: "Founder's message",
            name: "Muhammad Zeeshan",
            role: "Founder",
            message:
              "Serve Humanity began with a simple belief — that no neighbour should go hungry while we have the means to help. That belief still guides every meal we serve and every hand we hold.",
          }}
        />

        <MessageSection
          block={ceo}
          imageLeft={false}
          fallback={{
            eyebrow: "CEO's message",
            name: "Muhammad Zeeshan",
            role: "Founder & CEO",
            message:
              "Transparency, dignity and local leadership are not slogans for us — they are how we work. Together with our chapters, we turn compassion into lasting change.",
          }}
        />

        <section id="programs" className="page-section scroll-mt-28">
          <Reveal>
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-accent">
                {programs.eyebrow || "Programs"}
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">
                {programs.titleHighlight
                  ? highlightTitle(programs.title || "Every program tells a story", programs.titleHighlight)
                  : programs.title || "Every program tells a story"}
              </h2>
              {programs.description && (
                <p className="mt-4 text-muted-foreground">{programs.description}</p>
              )}
            </div>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {programItems.map((p, i) => {
              const Icon = PROGRAM_ICONS[i % PROGRAM_ICONS.length];
              return (
                <Reveal key={p.title} delay={i}>
                  <div className="group relative h-full overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-elevated">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-warm opacity-0 transition-opacity duration-500 group-hover:opacity-[0.04]" />
                    <div className="relative">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-brand-accent transition-transform group-hover:rotate-6 group-hover:scale-110">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 font-display text-lg font-bold">{p.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                      {p.stat && (
                        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-semibold text-brand-blue">
                          {p.stat}
                        </div>
                      )}
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>
      </SiteLayout>
    </>
  );
}
