import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
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
  CheckCircle2,
  Sparkles,
  Users,
} from "lucide-react";
import { highlightTitle, useWebsitePage } from "@/lib/websiteContent";

const VALUE_ICONS = [Heart, Shield, Eye, Handshake, Lightbulb, Globe2];

const PROGRAM_ICONS = [
  Utensils,
  GraduationCap,
  Stethoscope,
  LifeBuoy,
  Baby,
  Heart,
  Droplets,
  Lightbulb,
];

type MessageBlock = {
  eyebrow?: string;
  name?: string;
  role?: string;
  message?: string;
  imageUrl?: string;
};

type AboutSections = {
  hero?: {
    eyebrow?: string;
    title?: string;
    titleHighlight?: string;
    description?: string;
  };
  story?: {
    title?: string;
    paragraphs?: string[];
    cta?: string;
    ctaLink?: string;
  };
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
  fallback: {
    eyebrow: string;
    name: string;
    role: string;
    message: string;
  };
}) {
  const eyebrow = block.eyebrow || fallback.eyebrow;
  const name = block.name || fallback.name;
  const role = block.role || fallback.role;
  const message = block.message || fallback.message;
  const imageUrl = block.imageUrl || "";

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div
        className={`container-page grid items-center gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16 ${
          imageLeft
            ? ""
            : "[&>*:first-child]:lg:order-2 [&>*:last-child]:lg:order-1"
        }`}
      >
        <Reveal>
          <div className="relative mx-auto w-full max-w-sm lg:max-w-md">
            <div className="absolute -inset-3 rounded-[2rem] bg-gradient-warm opacity-20 blur-xl" />

            <div className="absolute -right-3 -top-3 h-24 w-24 rounded-tr-[2rem] border-r-2 border-t-2 border-brand-orange/50 sm:-right-5 sm:-top-5 sm:h-32 sm:w-32" />

            <div className="relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-card p-2 shadow-xl sm:rounded-[2rem] sm:p-3">
              <div className="relative aspect-[4/4.2] overflow-hidden rounded-[1.35rem] bg-secondary">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-gradient-to-br from-brand-orange/15 via-background to-brand-blue/20">
                    <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-warm font-display text-3xl font-bold text-white shadow-lg">
                      {name
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] backdrop-blur-md">
                    <Heart className="h-3.5 w-3.5 text-brand-orange" />
                    {eyebrow}
                  </div>

                  <h3 className="font-display text-2xl font-bold sm:text-3xl">
                    {name}
                  </h3>

                  <p className="mt-1 text-sm text-white/75">{role}</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-orange/20 bg-brand-orange/[0.06] px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-orange sm:text-xs">
              <Quote className="h-3.5 w-3.5" />
              {eyebrow}
            </div>

            <blockquote className="mt-5 font-display text-xl font-semibold leading-relaxed tracking-tight text-foreground sm:text-2xl md:text-3xl">
              “{message}”
            </blockquote>

            <div className="mt-7 flex items-center gap-4 border-t border-border/70 pt-5">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-blue/10 text-brand-blue">
                <Users className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="font-display font-bold text-foreground">{name}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{role}</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function Page() {
  const { sections } = useWebsitePage<AboutSections>("about");
  const location = useLocation();

  const hero = sections.hero ?? {};
  const story = sections.story ?? {};
  const values = sections.values ?? [];
  const founder = sections.founder ?? {};
  const ceo = sections.ceo ?? {};
  const programs = sections.programs ?? {};
  const programItems = programs.items ?? [];
  const paragraphs = story.paragraphs ?? [];

  // Always start at the top when opening or navigating to this page.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.pathname, location.key]);

  return (
    <>
      <Helmet>
        <title>About Us — Serve Humanity</title>
        <meta
          name="description"
          content="Discover the story, values, leadership, and community programs behind Serve Humanity."
        />
        <meta property="og:title" content="About Us — Serve Humanity" />
        <meta
          property="og:description"
          content="Discover how Serve Humanity turns compassion into meaningful community action."
        />
        <meta property="og:url" content="/about" />
        <link rel="canonical" href="/about" />
      </Helmet>

      <SiteLayout>
        <main className="overflow-hidden">
          {/* HERO */}
          <section className="relative isolate overflow-hidden bg-background pb-12 pt-12 sm:pb-16 sm:pt-16 lg:pb-20 lg:pt-20">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10"
            >
              <div className="absolute inset-0 bg-mesh opacity-40" />
              <div className="absolute -left-28 top-0 h-72 w-72 rounded-full bg-brand-orange/10 blur-[100px] sm:h-96 sm:w-96" />
              <div className="absolute -right-28 top-10 h-72 w-72 rounded-full bg-brand-blue/10 blur-[100px] sm:h-96 sm:w-96" />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
            </div>

            <div className="container-page">
              <Reveal className="mx-auto max-w-4xl text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-orange/20 bg-card/80 px-4 py-2 shadow-sm backdrop-blur">
                  <Sparkles className="h-4 w-4 text-brand-orange" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue sm:text-xs">
                    {hero.eyebrow || "Who we are"}
                  </span>
                </div>

                <h1 className="mt-6 font-display text-3xl font-bold leading-[1.12] tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
                  {highlightTitle(
                    hero.title || "Ten years of showing up",
                    hero.titleHighlight,
                  )}
                </h1>

                <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8 md:text-lg">
                  {hero.description ||
                    "We bring people together to support families, create opportunities, and build stronger communities through compassion and action."}
                </p>

                <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    to="#our-story"
                    onClick={(event) => {
                      event.preventDefault();
                      document.getElementById("our-story")?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-warm px-5 py-3 text-sm font-bold text-white shadow-warm transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
                  >
                    Our story
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <Link
                    to="/events"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-card/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-brand-orange/50 hover:text-brand-orange"
                  >
                    Explore our work
                  </Link>
                </div>
              </Reveal>
            </div>
          </section>

          {/* OUR STORY + VALUES */}
          <section
            id="our-story"
            className="scroll-mt-24 border-y border-border/50 bg-card/40 py-14 sm:py-16 lg:py-20"
          >
            <div className="container-page grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
              <Reveal>
                <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent sm:text-xs">
                  <span className="h-px w-7 bg-brand-orange" />
                  Our story
                </div>

                <h2 className="mt-4 max-w-xl font-display text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
                  {story.title || "A simple belief. A lasting impact."}
                </h2>

                <div className="mt-5 max-w-xl space-y-4">
                  {paragraphs.length ? (
                    paragraphs.map((paragraph, index) => (
                      <p
                        key={`${index}-${paragraph.slice(0, 24)}`}
                        className="text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8"
                      >
                        {paragraph}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
                      Every meaningful change starts with people who care. We
                      work with communities to turn kindness into practical,
                      lasting support for those who need it most.
                    </p>
                  )}
                </div>

                <Link
                  to={story.ctaLink || "/team"}
                  className="group mt-7 inline-flex items-center gap-2 text-sm font-bold text-brand-blue transition-colors hover:text-brand-orange"
                >
                  {story.cta || "Meet our team"}
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-blue/10 transition-all group-hover:translate-x-1 group-hover:bg-brand-orange/10">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </Reveal>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                {values.map((value, index) => {
                  const Icon = VALUE_ICONS[index % VALUE_ICONS.length];

                  return (
                    <Reveal key={value.title} delay={index * 0.08}>
                      <article className="group h-full rounded-2xl border border-border/70 bg-background p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-orange/30 hover:shadow-lg sm:p-6">
                        <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-orange/10 text-brand-orange transition-colors group-hover:bg-brand-orange group-hover:text-white">
                          <Icon className="h-5 w-5" />
                        </div>

                        <h3 className="mt-4 font-display text-base font-bold text-foreground sm:text-lg">
                          {value.title}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {value.body}
                        </p>
                      </article>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </section>

          {/* LEADERSHIP */}
          <div className="py-4 sm:py-8">
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

            <div className="container-page">
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>

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
          </div>

          {/* PROGRAMS */}
          <section
            id="programs"
            className="scroll-mt-24 border-t border-border/50 bg-card/40 py-14 sm:py-16 lg:py-20"
          >
            <div className="container-page">
              <Reveal>
                <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
                  <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent sm:text-xs">
                    <span className="h-px w-7 bg-brand-orange" />
                    {programs.eyebrow || "What we do"}
                    <span className="h-px w-7 bg-brand-orange" />
                  </div>

                  <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl">
                    {programs.titleHighlight
                      ? highlightTitle(
                          programs.title || "Every program tells a story",
                          programs.titleHighlight,
                        )
                      : programs.title || "Every program tells a story"}
                  </h2>

                  {programs.description && (
                    <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
                      {programs.description}
                    </p>
                  )}
                </div>
              </Reveal>

              {programItems.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {programItems.map((program, index) => {
                    const Icon =
                      PROGRAM_ICONS[index % PROGRAM_ICONS.length];

                    return (
                      <Reveal key={program.title} delay={index * 0.06}>
                        <article className="group relative h-full overflow-hidden rounded-2xl border border-border/70 bg-background p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-orange/30 hover:shadow-xl sm:rounded-3xl sm:p-6">
                          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand-orange/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

                          <div className="relative">
                            <div className="flex items-center justify-between">
                              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-blue/10 text-brand-blue transition-all duration-300 group-hover:rotate-3 group-hover:bg-brand-orange group-hover:text-white">
                                <Icon className="h-5 w-5" />
                              </div>

                              <span className="text-xs font-semibold tabular-nums text-muted-foreground/60">
                                {String(index + 1).padStart(2, "0")}
                              </span>
                            </div>

                            <h3 className="mt-5 font-display text-lg font-bold text-foreground">
                              {program.title}
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              {program.body}
                            </p>

                            {program.stat && (
                              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-blue/10 px-3 py-1.5 text-xs font-semibold text-brand-blue">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {program.stat}
                              </div>
                            )}
                          </div>
                        </article>
                      </Reveal>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Our programs will be shared here soon.
                </div>
              )}
            </div>
          </section>

          {/* FINAL CTA */}
          <section className="py-14 sm:py-16 lg:py-20">
            <div className="container-page">
              <Reveal>
                <div className="relative isolate overflow-hidden rounded-[1.75rem] bg-gradient-cool px-6 py-10 text-center shadow-cool sm:rounded-[2rem] sm:px-10 sm:py-14">
                  <div className="pointer-events-none absolute inset-0 -z-10 bg-mesh opacity-40" />
                  <div className="pointer-events-none absolute -left-16 -top-16 -z-10 h-48 w-48 rounded-full bg-brand-orange/20 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-20 -right-16 -z-10 h-56 w-56 rounded-full bg-brand-blue/20 blur-3xl" />

                  <div className="mx-auto max-w-2xl">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-white/20 bg-white/10 text-brand-orange">
                      <Heart className="h-6 w-6" />
                    </div>

                    <h2 className="mt-5 font-display text-2xl font-bold text-white sm:text-3xl md:text-4xl">
                      Be part of something meaningful.
                    </h2>

                    <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/75 sm:text-base">
                      Your time, kindness, and support can help create stronger
                      communities and brighter futures.
                    </p>

                    <div className="mt-7 flex flex-wrap justify-center gap-3">
                      <Link
                        to="/volunteer"
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-warm px-6 py-3 text-sm font-bold text-white shadow-warm transition hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        Become a volunteer
                        <ArrowRight className="h-4 w-4" />
                      </Link>

                      <Link
                        to="/donate"
                        className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                      >
                        Support our mission
                      </Link>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>
        </main>
      </SiteLayout>
    </>
  );
}