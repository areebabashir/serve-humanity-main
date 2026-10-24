import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import CountUp from "react-countup";
// @ts-ignore
const CountUpComponent = (CountUp.default || CountUp) as any;
import {
  Heart, Users, MapPin, Package, HandHeart, Play, ArrowRight, Sparkles,
  Shield, Eye, Handshake, Globe2, Lightbulb, Utensils, GraduationCap,
  Stethoscope, LifeBuoy, Baby, Droplets, Star, ChevronRight, Quote,
  Calendar, Clock, CheckCircle2, FileCheck, PackageCheck, PhoneCall,
  Loader2,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import logoAsset from "@/assets/logo.png";
import { api, ApiRequestError } from "@/lib/api";
import { daysUntilEvent } from "@/lib/eventCountdown";
import { LOCAL_WEBSITE_DEFAULTS, readOfflineCache, useWebsitePage, writeOfflineCache } from "@/lib/websiteContent";
import { DonateAccountButton } from "@/components/site/DonateAccountButton";

type HomeSections = {
  hero?: {
    eyebrow?: string;
    titlePrefix?: string;
    titleHighlight?: string;
    subtitle?: string;
    primaryCta?: string;
    primaryCtaLink?: string;
    secondaryCta?: string;
    secondaryCtaLink?: string;
  };
  stats?: { label: string; value: string }[];
  partners?: {
    title?: string;
    items?: { name?: string; logoUrl?: string }[];
    names?: string[];
  };
  story?: {
    eyebrow?: string;
    title?: string;
    titleHighlight?: string;
    body?: string;
    points?: string[];
    cta?: string;
    ctaLink?: string;
    quote?: string;
    quoteAttr?: string;
    estLabel?: string;
    sideStats?: { value?: string; label?: string }[];
  };
  principles?: {
    eyebrow?: string;
    title?: string;
    titleHighlight?: string;
    subtitle?: string;
    items?: { title?: string; desc?: string }[];
  };
  impact?: {
    eyebrow?: string;
    title?: string;
    titleHighlight?: string;
    body?: string;
    stats?: { label?: string; end?: number; suffix?: string }[];
  };
  eightWays?: {
    eyebrow?: string;
    title?: string;
    titleHighlight?: string;
    items?: { title?: string; desc?: string }[];
  };
  chaptersMap?: {
    eyebrow?: string;
    title?: string;
    titleHighlight?: string;
  };
  testimonials?: {
    eyebrow?: string;
    title?: string;
    titleHighlight?: string;
  };
  donateCta?: {
    eyebrow?: string;
    title?: string;
    titleHighlight?: string;
    body?: string;
    cta?: string;
  };
};

type PublicChapter = {
  id: string;
  name: string;
  city: string;
  imageUrl?: string;
  president: string;
  members: number;
  projects: number;
};

type MapPin = {
  name: string;
  president: string;
  members: number;
  projects: number;
  imageUrl?: string;
  x: number;
  y: number;
};

const CITY_MAP_COORDS: Record<string, { x: number; y: number }> = {
  karachi: { x: 22, y: 62 },
  lahore: { x: 32, y: 45 },
  islamabad: { x: 35, y: 36 },
  rawalpindi: { x: 36, y: 38 },
  peshawar: { x: 28, y: 30 },
  quetta: { x: 12, y: 52 },
  dubai: { x: 52, y: 55 },
  london: { x: 45, y: 22 },
  "new york": { x: 18, y: 30 },
  faisalabad: { x: 30, y: 48 },
  multan: { x: 26, y: 52 },
  hyderabad: { x: 24, y: 58 },
};

const FALLBACK_MAP_PINS: MapPin[] = [
  { name: "Karachi", president: "TBD", members: 0, projects: 0, x: 22, y: 62 },
  { name: "Lahore", president: "TBD", members: 0, projects: 0, x: 32, y: 45 },
  { name: "Islamabad", president: "TBD", members: 0, projects: 0, x: 35, y: 36 },
  { name: "Peshawar", president: "TBD", members: 0, projects: 0, x: 28, y: 30 },
  { name: "Quetta", president: "TBD", members: 0, projects: 0, x: 12, y: 52 },
  { name: "Dubai", president: "TBD", members: 0, projects: 0, x: 52, y: 55 },
  { name: "London", president: "TBD", members: 0, projects: 0, x: 45, y: 22 },
  { name: "New York", president: "TBD", members: 0, projects: 0, x: 18, y: 30 },
];

function coordsForCity(city: string, index: number): { x: number; y: number } {
  const key = city.trim().toLowerCase();
  if (CITY_MAP_COORDS[key]) return CITY_MAP_COORDS[key];
  const col = index % 4;
  const row = Math.floor(index / 4);
  return { x: 18 + col * 18, y: 22 + row * 12 };
}

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Serve Humanity — Together We Build Hope</title>
        <meta name="description" content="Join Serve Humanity \u2014 a global humanitarian movement delivering food, education, healthcare and hope to communities in need. Donate, volunteer, transform lives." />
        <meta property="og:title" content="Serve Humanity \u2014 Together We Build Hope" />
        <meta property="og:url" content="/" />
        <link rel="canonical" href="/" />
      </Helmet>
      <HomePage />
    </>
  );
}


/* ---------------- HERO ---------------- */
function Hero({ sections }: { sections: HomeSections }) {
  const hero = sections.hero ?? {};
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });
  const tx1 = useTransform(sx, (v) => v * 20);
  const ty1 = useTransform(sy, (v) => v * 20);
  const tx2 = useTransform(sx, (v) => v * -14);
  const ty2 = useTransform(sy, (v) => v * -14);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5);
      my.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  const STAT_META = [
    { icon: Users, color: "text-brand-accent" },
    { icon: HandHeart, color: "text-brand-orange" },
    { icon: MapPin, color: "text-brand-blue" },
    { icon: Package, color: "text-success" },
    { icon: Heart, color: "text-brand-accent" },
  ];
  const stats = (sections.stats ?? []).map((s, i) => ({
    ...s,
    icon: STAT_META[i % STAT_META.length].icon,
    color: STAT_META[i % STAT_META.length].color,
  }));

  return (
    <section className="relative min-h-screen overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24">
      {/* animated mesh */}
      <div className="pointer-events-none absolute inset-0 bg-mesh animate-gradient-shift" />
      {/* blobs */}
      <motion.div
        style={{ x: tx1, y: ty1 }}
        className="pointer-events-none absolute -left-24 top-24 h-96 w-96 rounded-full bg-brand-orange/30 blur-3xl"
      />
      <motion.div
        style={{ x: tx2, y: ty2 }}
        className="pointer-events-none absolute right-0 top-40 h-[28rem] w-[28rem] rounded-full bg-brand-blue/25 blur-3xl"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

      {/* floating particles */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-brand-orange/40"
            style={{
              left: `${(i * 53) % 100}%`,
              top: `${(i * 37) % 100}%`,
              animation: `float-slow ${6 + (i % 5)}s ease-in-out ${i * 0.3}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="container-page relative grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        {/* Left */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-brand-blue backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5 text-brand-orange" />
            {hero.eyebrow || "Humanitarian welfare · Since 2014"}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 font-display text-5xl font-bold leading-[1.02] tracking-tight text-foreground md:text-7xl"
          >
            {hero.titlePrefix || "Together We"}{" "}
            <span className="relative inline-block">
              <span className="text-gradient-warm">{hero.titleHighlight || "Build Hope"}</span>
              <svg
                className="absolute -bottom-2 left-0 w-full text-brand-orange/60"
                viewBox="0 0 200 12"
                fill="none"
              >
                <motion.path
                  d="M2 8 Q 50 2 100 6 T 198 6"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.4, delay: 0.9 }}
                />
              </svg>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg"
          >
            {hero.subtitle ||
              "A world where compassion meets action. Join thousands of volunteers creating lasting change in communities that need it most."}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link
              to={hero.primaryCtaLink || "/donate"}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-warm px-6 py-3.5 text-sm font-semibold text-white shadow-warm transition-transform hover:-translate-y-0.5"
            >
              <Heart className="h-4 w-4 fill-white/40" />
              {hero.primaryCta || "Donate Now"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </Link>
            <Link
              to="/volunteer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-6 py-3.5 text-sm font-semibold text-foreground shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-orange hover:text-brand-orange"
            >
              <FileCheck className="h-4 w-4" />
              Need Support
            </Link>
            {hero.secondaryCtaLink && hero.secondaryCtaLink !== "/volunteer" ? (
              <Link
                to={hero.secondaryCtaLink}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-6 py-3.5 text-sm font-semibold text-foreground shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-blue hover:text-brand-blue"
              >
                <HandHeart className="h-4 w-4" />
                {hero.secondaryCta || "Learn more"}
              </Link>
            ) : null}
          </motion.div>
        </div>

        {/* Right — glass dashboard */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          {/* rings */}
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="h-[420px] w-[420px] rounded-full border border-dashed border-brand-blue/20" />
          </div>
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="h-[300px] w-[300px] rounded-full border border-dashed border-brand-orange/25" />
          </div>

      

          <div className="relative mt-4 space-y-3">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.09, duration: 0.6 }}
                style={{
                  marginLeft: `${(i % 2) * 40}px`,
                }}
                className="group flex items-center gap-3 rounded-2xl border border-white/60 bg-white/70 p-3 pr-5 shadow-elevated backdrop-blur-xl transition-transform hover:-translate-y-0.5"
              >
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </div>
                  <div className="font-display text-lg font-bold text-foreground">{s.value}</div>
                </div>
                <div className="ml-auto text-[10px] font-semibold text-success">● live</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------- ABOUT ---------------- */
function About({ sections }: { sections: HomeSections }) {
  const story = sections.story ?? {};
  const points = (story.points ?? []).filter(Boolean);
  const title = story.title || "A decade of turning";
  const highlight = story.titleHighlight || "compassion into action";

  return (
    <section className="relative py-24">
      <div className="container-page grid gap-12 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-orange">
            {story.eyebrow || "Our story"}
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold leading-tight md:text-5xl">
            {title}{" "}
            <span className="text-gradient-brand">{highlight}</span>
          </h2>
          <p className="mt-5 text-muted-foreground md:text-lg">
            {story.body}
          </p>
          <ul className="mt-8 space-y-3">
            {points.map((p, i) => (
              <Reveal key={i} as="li" delay={i} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-orange/15 text-brand-accent">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <span className="text-foreground">{p}</span>
              </Reveal>
            ))}
          </ul>
          <div className="mt-8">
            <Link
              to={story.ctaLink || "/about"}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:gap-2.5 transition-all"
            >
              {story.cta || "Read our full story"} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>

        <Reveal delay={1} className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-gradient-cool p-8 shadow-cool">
            <div className="absolute inset-0 bg-mesh opacity-40" />
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-orange/40 blur-3xl animate-blob" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/20 blur-3xl animate-blob" />
            <div className="relative flex h-full flex-col justify-between text-white">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-orange animate-pulse" />
                  {story.estLabel || "Est. 2014"}
                </div>
                <blockquote className="mt-8 font-display text-2xl font-medium leading-tight md:text-3xl">
                  "{story.quote}"
                </blockquote>
                <p className="mt-4 text-sm text-white/70">{story.quoteAttr}</p>
              </div>
              <div className="border-t border-white/10 pt-6 text-center">
                <p className="font-display text-2xl font-semibold italic tracking-wide text-white/95 md:text-3xl">
                  Heart that Serves
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- VALUES ---------------- */
function Values({ sections }: { sections: HomeSections }) {
  const principles = sections.principles ?? {};
  const VALUE_META = [
    { icon: Heart, color: "from-brand-accent to-brand-orange" },
    { icon: Shield, color: "from-brand-blue to-brand-blue-light" },
    { icon: Eye, color: "from-success to-brand-blue" },
    { icon: Handshake, color: "from-brand-orange to-brand-accent" },
    { icon: Lightbulb, color: "from-brand-blue-light to-brand-orange" },
    { icon: Globe2, color: "from-brand-accent to-brand-blue" },
  ];
  const values = (principles.items ?? []).map((item, i) => ({
    title: item.title || "",
    desc: item.desc || "",
    icon: VALUE_META[i % VALUE_META.length].icon,
    color: VALUE_META[i % VALUE_META.length].color,
  }));

  return (
    <section className="relative py-24">
      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-orange">
            {principles.eyebrow || "Core values"}
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">
            {principles.title || "The principles that"}{" "}
            <span className="text-gradient-brand">{principles.titleHighlight || "guide every act"}</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            {principles.subtitle}
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((v, i) => (
            <Reveal key={`${v.title}-${i}`} delay={i}>
              <div className="group relative h-full overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-elevated">
                <div className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${v.color} opacity-10`} />
                </div>
                <div className={`relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${v.color} text-white shadow-warm transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110`}>
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="relative mt-5 font-display text-xl font-bold">{v.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
                  {v.desc}
                </p>
                <div className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-gradient-to-br from-brand-orange/0 to-brand-orange/0 blur-2xl transition-all duration-500 group-hover:from-brand-orange/30" />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- IMPACT ---------------- */
function Impact({ sections }: { sections: HomeSections }) {
  const impact = sections.impact ?? {};
  const stats = (impact.stats ?? []).map((s) => ({
    end: Number(s.end) || 0,
    suffix: s.suffix || "",
    label: s.label || "",
  }));

  return (
    <section className="relative overflow-hidden py-24">
      <div className="absolute inset-0 bg-gradient-cool" />
      <div className="pointer-events-none absolute inset-0 bg-mesh opacity-40" />
      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 w-full text-background"
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path fill="currentColor" d="M0,80 C240,20 480,120 720,60 C960,0 1200,100 1440,60 L1440,100 L0,100 Z" />
      </svg>
      <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-brand-orange/30 blur-3xl animate-blob" />

      <div className="container-page relative text-white">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-orange">
            {impact.eyebrow || "Measured impact"}
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">
            {impact.title || "Numbers that represent"}{" "}
            <span className="text-gradient-warm">{impact.titleHighlight || "real people"}</span>
          </h2>
          <p className="mt-4 text-white/70">
            {impact.body}
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={`${s.label}-${i}`} delay={i}>
              <div className="group relative rounded-3xl border border-white/10 bg-white/5 p-7 text-center backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/10">
                <div className="font-display text-5xl font-bold tracking-tight">
                  <CountUpComponent end={s.end} duration={2.4} separator="," enableScrollSpy scrollSpyOnce />
                  {s.suffix}
                </div>
                <div className="mt-2 text-xs font-medium uppercase tracking-widest text-white/70">
                  {s.label}
                </div>
                <div className="pointer-events-none absolute inset-x-6 bottom-2 h-px bg-gradient-to-r from-transparent via-brand-orange to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- CHAPTERS MAP ---------------- */
function Chapters({ sections }: { sections: HomeSections }) {
  const mapCopy = sections.chaptersMap ?? {};
  const [pins, setPins] = useState<MapPin[]>(() => {
    const cached = readOfflineCache<MapPin[]>("home:chapters-map");
    return cached?.length ? cached : FALLBACK_MAP_PINS;
  });
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api<{ success: true; data: PublicChapter[] }>("/chapters/public")
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : [];
        if (!list.length) {
          const cached = readOfflineCache<MapPin[]>("home:chapters-map");
          setPins(cached?.length ? cached : FALLBACK_MAP_PINS);
          return;
        }
        const next = list.map((c, i) => {
          const label = c.city || c.name || `Chapter ${i + 1}`;
          const pos = coordsForCity(label, i);
          return {
            name: label,
            president: c.president || "TBD",
            members: Number(c.members) || 0,
            projects: Number(c.projects) || 0,
            imageUrl: c.imageUrl || "",
            x: pos.x,
            y: pos.y,
          };
        });
        writeOfflineCache("home:chapters-map", next);
        setPins(next);
        setActive(0);
      })
      .catch(() => {
        if (!cancelled) {
          const cached = readOfflineCache<MapPin[]>("home:chapters-map");
          setPins(cached?.length ? cached : FALLBACK_MAP_PINS);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const current = pins[active] ?? pins[0];

  return (
    <section className="relative py-24">
      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-orange">
            {mapCopy.eyebrow || "Global chapters"}
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">
            {mapCopy.title || "Local roots,"}{" "}
            <span className="text-gradient-brand">{mapCopy.titleHighlight || "global reach"}</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Reveal className="relative overflow-hidden rounded-3xl border border-border bg-gradient-cool p-6 shadow-cool">
            <div className="absolute inset-0 bg-mesh opacity-30" />
            {loading ? (
              <div className="relative grid h-64 place-items-center text-white/80">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <svg viewBox="0 0 100 60" className="relative h-full w-full min-h-[240px]">
                <defs>
                  <pattern id="grid" width="4" height="4" patternUnits="userSpaceOnUse">
                    <path
                      d="M4 0 L0 0 0 4"
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="0.2"
                    />
                  </pattern>
                </defs>
                <rect width="100" height="60" fill="url(#grid)" />
                {[
                  "M10,20 Q25,15 35,25 Q40,35 25,42 Q12,40 8,32 Z",
                  "M42,18 Q58,12 66,22 Q60,35 48,32 Q42,28 42,18 Z",
                  "M70,25 Q85,20 92,32 Q86,45 74,42 Q68,36 70,25 Z",
                ].map((d, i) => (
                  <path key={i} d={d} fill="rgba(255,255,255,0.06)" />
                ))}
                {pins.map((p, i) => {
                  const isActive = i === active;
                  return (
                    <g
                      key={`${p.name}-${i}`}
                      transform={`translate(${p.x} ${p.y})`}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => setActive(i)}
                      className="cursor-pointer"
                    >
                      <circle r={isActive ? 3 : 2} fill="#F89C1B" opacity="0.35">
                        <animate attributeName="r" values="2;5;2" dur="2s" repeatCount="indefinite" />
                        <animate
                          attributeName="opacity"
                          values="0.5;0;0.5"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </circle>
                      <circle r={isActive ? 1.6 : 1.2} fill="#F89C1B" />
                      <text
                        y={-2.5}
                        textAnchor="middle"
                        fontSize="1.6"
                        fill="white"
                        opacity={isActive ? 1 : 0.6}
                        fontWeight={600}
                      >
                        {p.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </Reveal>

          <Reveal delay={1}>
            <div className="rounded-3xl border border-border bg-card p-7 shadow-soft">
              {current ? (
                <>
                  {current.imageUrl ? (
                    <img
                      src={current.imageUrl}
                      alt={current.name}
                      className="mb-4 h-36 w-full rounded-2xl object-cover"
                      loading="lazy"
                    />
                  ) : null}
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-brand-blue">
                    <MapPin className="h-3.5 w-3.5" /> {current.name} Chapter
                  </div>
                  <h3 className="mt-2 font-display text-2xl font-bold">{current.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Led by <b className="text-foreground">{current.president}</b>
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-secondary p-4">
                      <div className="text-xs text-muted-foreground">Members</div>
                      <div className="font-display text-2xl font-bold">{current.members}</div>
                    </div>
                    <div className="rounded-2xl bg-secondary p-4">
                      <div className="text-xs text-muted-foreground">Cases</div>
                      <div className="font-display text-2xl font-bold">{current.projects}</div>
                    </div>
                  </div>
                  <div className="mt-5 max-h-56 space-y-1.5 overflow-y-auto">
                    {pins.map((p, i) => (
                      <button
                        key={`${p.name}-${i}`}
                        type="button"
                        onClick={() => setActive(i)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                          i === active
                            ? "bg-accent text-brand-accent"
                            : "text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        <span className="font-medium">{p.name}</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No chapters published yet.</p>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------- PROGRAMS (Bento) ---------------- */
function Programs({ sections }: { sections: HomeSections }) {
  const eightWays = sections.eightWays ?? {};
  const PROGRAM_META = [
    { icon: Utensils, cls: "md:col-span-2 md:row-span-2 bg-gradient-warm text-white" },
    { icon: GraduationCap, cls: "bg-card" },
    { icon: Stethoscope, cls: "bg-card" },
    { icon: LifeBuoy, cls: "md:col-span-2 bg-gradient-cool text-white" },
    { icon: Baby, cls: "bg-card" },
    { icon: Heart, cls: "bg-card" },
    { icon: Droplets, cls: "bg-card" },
    { icon: Lightbulb, cls: "bg-card" },
  ];
  const cards = (eightWays.items ?? []).map((item, i) => ({
    title: item.title || "",
    desc: item.desc || "",
    icon: PROGRAM_META[i % PROGRAM_META.length].icon,
    cls: PROGRAM_META[i % PROGRAM_META.length].cls,
  }));

  return (
    <section className="relative py-24">
      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-orange">
            {eightWays.eyebrow || "Programs"}
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">
            {eightWays.title || "Eight ways we show up"}{" "}
            <span className="text-gradient-brand">{eightWays.titleHighlight || "every single day"}</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-4 md:grid-rows-3 md:auto-rows-[180px]">
          {cards.map((c, i) => {
            const isBig = c.cls.includes("row-span-2");
            const isDark = c.cls.includes("text-white");
            return (
              <Reveal
                key={`${c.title}-${i}`}
                delay={i}
                className={`group relative overflow-hidden rounded-3xl border ${isDark ? "border-white/10" : "border-border"} p-6 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-elevated ${c.cls}`}
              >
                {isDark && <div className="absolute inset-0 bg-mesh opacity-30" />}
                <div className="pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-3xl transition-all duration-500 group-hover:scale-125" />
                <div className="relative flex h-full flex-col">
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${isDark ? "bg-white/10 text-white" : "bg-accent text-brand-accent"} transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110`}>
                    <c.icon className="h-5 w-5" />
                  </div>
                  <div className="mt-auto pt-6">
                    <h3 className={`font-display font-bold leading-tight ${isBig ? "text-2xl md:text-3xl" : "text-lg"}`}>
                      {c.title}
                    </h3>
                    <p className={`mt-1.5 text-sm ${isDark ? "text-white/80" : "text-muted-foreground"}`}>
                      {c.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- TIMELINE ---------------- */
function Timeline() {
  const steps = [
    { icon: FileCheck, title: "Application", desc: "Family submits a request through our app or a local chapter." },
    { icon: Eye, title: "Verification", desc: "A volunteer visits, confirms need and captures documentation." },
    { icon: CheckCircle2, title: "Approval", desc: "Committee approves within 48 hours based on urgency & scope." },
    { icon: PackageCheck, title: "Distribution", desc: "Aid — food, cash, medicine — is delivered with dignity." },
    { icon: PhoneCall, title: "Follow-up", desc: "We call back in 30 days. Impact is real only if it lasts." },
  ];
  return (
    <section className="relative py-24">
      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-orange">
            Our process
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">
            How every donation <span className="text-gradient-brand">reaches a life</span>
          </h2>
        </Reveal>

        <div className="relative mt-16">
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-border to-transparent md:block hidden" />
          <div className="grid gap-6 md:gap-10">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i}>
                <div className={`grid gap-4 md:grid-cols-2 md:items-center ${i % 2 ? "md:[direction:rtl]" : ""}`}>
                  <div className={`md:[direction:ltr] ${i % 2 ? "md:pl-12" : "md:pr-12 md:text-right"}`}>
                    <div className="text-xs font-bold uppercase tracking-widest text-brand-orange">
                      Step {i + 1}
                    </div>
                    <h3 className="mt-1 font-display text-2xl font-bold">{s.title}</h3>
                    <p className="mt-1.5 text-muted-foreground">{s.desc}</p>
                  </div>
                  <div className={`md:[direction:ltr] relative ${i % 2 ? "md:justify-self-end md:pr-12" : "md:pl-12"}`}>
                    <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-warm text-white shadow-warm animate-pulse-ring">
                      <s.icon className="h-6 w-6" />
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- EVENTS ---------------- */
function Events() {
  const { sections } = useWebsitePage<{
    hero?: { eyebrow?: string; title?: string; titleHighlight?: string };
  }>("events");
  const hero = sections.hero ?? {};
  const [items, setItems] = useState<
    { id: string; title: string; date: string; dateIso?: string | null; location: string; days: number }[]
  >(() => readOfflineCache("home:events") || []);
  const title = hero.title || "Show up. Change lives.";
  const highlight = hero.titleHighlight || "Change lives.";
  const titleLead = title.replace(highlight, "").trim() || "Show up.";

  useEffect(() => {
    let cancelled = false;
    api<{
      success: true;
      data: {
        id: string;
        title: string;
        date: string;
        dateIso?: string | null;
        location: string;
        days: number;
      }[];
    }>("/website-events/public?limit=3")
      .then((res) => {
        if (cancelled) return;
        const next = (res.data || []).slice(0, 3);
        writeOfflineCache("home:events", next);
        setItems(next);
      })
      .catch(() => {
        if (!cancelled) {
          const cached = readOfflineCache<typeof items>("home:events");
          setItems(cached?.length ? cached : []);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!items.length) return null;

  return (
    <section className="relative py-24">
      <div className="container-page">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-orange">
              {hero.eyebrow || "Upcoming events"}
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">
              {titleLead} <span className="text-gradient-brand">{highlight}</span>
            </h2>
          </div>
          <Link to="/events" className="text-sm font-semibold text-brand-blue hover:underline">
            View all events →
          </Link>
        </Reveal>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {items.map((e, i) => {
            const days = daysUntilEvent(e.dateIso, e.days);
            return (
            <Reveal key={e.id} delay={i}>
              <div className="group relative overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-soft transition-all duration-500 hover:-translate-y-2 hover:shadow-elevated">
                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-orange/20 blur-3xl transition-all duration-500 group-hover:scale-125" />
                <div className="relative flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-accent">
                  <Calendar className="h-3.5 w-3.5" /> {e.date || "TBA"}
                </div>
                <h3 className="relative mt-3 font-display text-xl font-bold">{e.title}</h3>
                <p className="relative mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {e.location || "—"}
                </p>
                <div className="relative mt-6 flex items-center justify-between rounded-2xl bg-secondary p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> Starts in
                  </div>
                  <div className="font-display text-lg font-bold text-brand-blue">
                    {days} <span className="text-xs font-medium">days</span>
                  </div>
                </div>
                <Link
                  to="/events"
                  className="relative mt-4 flex w-full items-center justify-center rounded-full bg-gradient-warm py-2.5 text-sm font-semibold text-white shadow-warm transition-transform hover:-translate-y-0.5"
                >
                  Register
                </Link>
              </div>
            </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- TESTIMONIALS ---------------- */
function Testimonials({ sections }: { sections: HomeSections }) {
  const block = sections.testimonials ?? {};

  const [approved, setApproved] = useState<
    { name: string; role: string; text: string; stars: number }[]
  >([]);
  const [form, setForm] = useState({ name: "", role: "", text: "", stars: 5 });
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState("");
  const [formErr, setFormErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    api<{ success: true; data: { name: string; role?: string; text: string; stars?: number }[] }>(
      "/reviews/public",
    )
      .then((res) => {
        if (cancelled) return;
        const list = (res.data || [])
          .map((r) => ({
            name: r.name || "Anonymous",
            role: r.role || "",
            text: r.text || "",
            stars: Math.min(5, Math.max(1, Number(r.stars) || 5)),
          }))
          .filter((r) => r.text);
        setApproved(list);
      })
      .catch(() => {
        if (!cancelled) setApproved([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const t = approved.filter((item) => item.text);
  // Duplicate once so the CSS marquee loop is seamless (off-screen clone).
  const row = t.length ? [...t, ...t] : [];

  async function submitReview(e: FormEvent) {
    e.preventDefault();
    setFormErr("");
    setFormMsg("");
    setSubmitting(true);
    try {
      const res = await api<{ success: true; message?: string }>("/reviews", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          role: form.role.trim(),
          text: form.text.trim(),
          stars: form.stars,
        }),
      });
      setFormMsg(res.message || "Submitted for approval. Thank you!");
      setForm({ name: "", role: "", text: "", stars: 5 });
    } catch (err) {
      setFormErr(err instanceof ApiRequestError ? err.message : "Could not submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="relative overflow-hidden py-24">
      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-orange">
            {block.eyebrow || "Voices"}
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">
            {block.title || "Stories from the"}{" "}
            <span className="text-gradient-brand">{block.titleHighlight || "people we serve"}</span>
          </h2>
        </Reveal>
      </div>

      {t.length ? (
        <div className="relative mt-14 group">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent sm:w-24" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent sm:w-24" />
          <div className="flex w-max animate-marquee gap-5 group-hover:[animation-play-state:paused]">
            {row.map((r, i) => (
              <article
                key={`${r.name}-${i}`}
                className="w-[300px] shrink-0 rounded-3xl border border-border bg-card p-6 shadow-soft sm:w-[340px]"
                aria-hidden={i >= t.length}
              >
                <Quote className="h-6 w-6 text-brand-orange/60" />
                <p className="mt-3 text-sm leading-relaxed text-foreground">{r.text}</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-warm font-display font-bold text-white">
                    {r.name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.role}</div>
                  </div>
                  <div className="ml-auto flex text-brand-orange">
                    {Array.from({ length: r.stars }).map((_, si) => (
                      <Star key={si} className="h-3 w-3 fill-current" />
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <div className="container-page mt-14">
        <Reveal>
          <form
            onSubmit={submitReview}
            className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-soft md:p-8"
          >
            <h3 className="font-display text-xl font-bold">Share your experience</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Reviews appear on the website after CEO approval.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Name</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm outline-none focus:border-brand-orange"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Role (optional)</span>
                <input
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  placeholder="Volunteer, Donor…"
                  className="mt-1 w-full rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm outline-none focus:border-brand-orange"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-medium text-muted-foreground">Your review</span>
                <textarea
                  required
                  rows={3}
                  value={form.text}
                  onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm outline-none focus:border-brand-orange"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Stars</span>
                <select
                  value={form.stars}
                  onChange={(e) => setForm((f) => ({ ...f, stars: Number(e.target.value) || 5 }))}
                  className="mt-1 w-full rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm outline-none focus:border-brand-orange"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {formErr ? (
              <p className="mt-3 text-xs text-red-700">{formErr}</p>
            ) : null}
            {formMsg ? (
              <p className="mt-3 text-xs text-emerald-700">{formMsg}</p>
            ) : null}
            <button
              type="submit"
              disabled={submitting}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-warm px-6 py-2.5 text-sm font-bold text-white shadow-warm disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                </>
              ) : (
                "Submit review"
              )}
            </button>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- DONATE ---------------- */
function DonateCTA({ sections }: { sections: HomeSections }) {
  const defaults =
    (LOCAL_WEBSITE_DEFAULTS.home as { donateCta?: HomeSections["donateCta"] }).donateCta || {};
  const donate = { ...defaults, ...(sections.donateCta || {}) };

  return (
    <section className="relative py-24">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-[2rem] border border-border bg-gradient-cool p-6 shadow-cool md:p-14">
          <div className="absolute inset-0 bg-mesh opacity-40" />
          <div className="pointer-events-none absolute -left-24 -bottom-24 h-96 w-96 rounded-full bg-brand-orange/30 blur-3xl animate-blob" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl animate-blob" />

          <div className="relative grid gap-10 lg:grid-cols-[1.2fr_auto] lg:items-center">
            <div className="text-white">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-orange">
                {donate.eyebrow || "Make a difference today"}
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">
                {donate.title || "Your donation,"}{" "}
                <span className="text-gradient-warm">
                  {donate.titleHighlight || "multiplied by love"}
                </span>
              </h2>
              <p className="mt-4 max-w-md text-white/70">
                {donate.body ||
                  "Every donation is tracked, verified and delivered through our chapter network."}
              </p>
            </div>

            <div className="flex justify-center lg:justify-end">
              <DonateAccountButton label={donate.cta || "Donate now"} className="min-w-[220px]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- SPONSORS ---------------- */
function Sponsors({ sections }: { sections: HomeSections }) {
  const partners = sections.partners ?? {};
  const items: { name: string; logoUrl: string }[] = (() => {
    if (partners.items?.length) {
      return partners.items
        .map((p) => ({ name: p.name || "", logoUrl: p.logoUrl || "" }))
        .filter((p) => p.name || p.logoUrl);
    }
    if (partners.names?.length) {
      return partners.names.filter(Boolean).map((name) => ({ name, logoUrl: "" }));
    }
    return [];
  })();

  if (!items.length) return null;

  // Triple the row for a smoother endless scroll when there are few partners
  const row = items.length < 6 ? [...items, ...items, ...items] : [...items, ...items];

  return (
    <section className="relative overflow-hidden border-y border-brand-blue/10 bg-gradient-to-b from-secondary/80 via-white to-secondary/60 py-14 md:py-16">
      <div className="pointer-events-none absolute -left-16 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-brand-orange/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-brand-blue/10 blur-3xl" />

      <div className="container-page relative">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gradient-warm" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-blue">
            {partners.title || "Trusted by partners around the world"}
          </p>
        </div>
      </div>

      <div className="relative mt-8">
        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent md:w-28" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent md:w-28" />

        <div className="group overflow-hidden py-2">
          <div className="flex w-max animate-marquee items-stretch gap-5 group-hover:[animation-play-state:paused] md:gap-6">
            {row.map((p, i) => (
              <div
                key={`${p.name}-${i}`}
                title={p.name}
                className="flex w-[9.5rem] shrink-0 flex-col items-center justify-center gap-2.5 rounded-2xl border border-brand-blue/10 bg-white px-4 py-4 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-orange/30 hover:shadow-elevated md:w-[11rem] md:px-5 md:py-5"
              >
                <div className="grid h-14 w-full place-items-center md:h-16">
                  {p.logoUrl ? (
                    <img
                      src={p.logoUrl}
                      alt={p.name || "Partner logo"}
                      className="max-h-14 max-w-full object-contain transition duration-300 md:max-h-16"
                      loading="lazy"
                    />
                  ) : (
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-cool font-display text-sm font-bold text-white">
                      {(p.name || "?").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                {p.name ? (
                  <span className="line-clamp-1 text-center text-[11px] font-semibold text-muted-foreground md:text-xs">
                    {p.name}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- BACK-TO-TOP ---------------- */
function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 600);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  if (!show) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="fixed bottom-6 right-6 z-40 grid h-12 w-12 place-items-center rounded-full bg-gradient-warm text-white shadow-warm transition-transform hover:-translate-y-1"
    >
      <ArrowRight className="h-5 w-5 -rotate-90" />
    </button>
  );
}

/* ---------------- HOME ---------------- */
function HomePage() {
  const { sections } = useWebsitePage<HomeSections>("home");
  return (
    <SiteLayout>
      <Hero sections={sections} />
      <Sponsors sections={sections} />
      <About sections={sections} />
      <Values sections={sections} />
      <Impact sections={sections} />
      <Chapters sections={sections} />
      <Programs sections={sections} />
      <Timeline />
      <Events />
      <Testimonials sections={sections} />
      <DonateCTA sections={sections} />
      <BackToTop />
    </SiteLayout>
  );
}
