import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import CountUp from "react-countup";
import heroImage   from "../assets/hero.png"

// @ts-ignore
const CountUpComponent = (CountUp.default || CountUp) as any;
import {
  Heart, Users, MapPin, Package, HandHeart, Play, ArrowRight, Sparkles,
  Shield, Eye, Handshake, Globe2, Lightbulb, Utensils, GraduationCap,
  Stethoscope, LifeBuoy, Baby, Droplets, Star, ChevronRight, Quote,
  Calendar, Clock, CheckCircle2, FileCheck, PackageCheck, PhoneCall,
  Loader2,ArrowUpRight,
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
    body?: string;
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

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, {
    stiffness: 45,
    damping: 18,
    mass: 0.6,
  });

  const springY = useSpring(mouseY, {
    stiffness: 45,
    damping: 18,
    mass: 0.6,
  });

  const imageX = useTransform(springX, (v) => v * 5);
  const imageY = useTransform(springY, (v) => v * 5);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      mouseX.set(event.clientX / window.innerWidth - 0.5);
      mouseY.set(event.clientY / window.innerHeight - 0.5);
    };

    window.addEventListener("mousemove", onMove, { passive: true });

    return () => window.removeEventListener("mousemove", onMove);
  }, [mouseX, mouseY]);

  const STAT_META = [
    { icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { icon: HandHeart, color: "text-orange-600", bg: "bg-orange-50" },
    { icon: MapPin, color: "text-blue-600", bg: "bg-blue-50" },
    { icon: Package, color: "text-emerald-600", bg: "bg-emerald-50" },
    { icon: Heart, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  const stats = (sections.stats ?? []).map((stat, index) => ({
    ...stat,
    ...STAT_META[index % STAT_META.length],
  }));

  const featuredStats = stats.slice(0, 3);

  return (
    <section className="relative isolate flex min-h-[300px] items-center overflow-hidden bg-slate-950 sm:min-h-[760px] lg:min-h-[calc(100svh-4rem)] lg:h-[780px] lg:max-h-[900px]">
      {/* Full-screen background photograph */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 -z-20"
        style={{
          x: imageX,
          y: imageY,
          scale: 1.04,
        }}
      >
        <img
          src={heroImage}
          alt=""
          className="h-full w-full object-cover object-center"
          fetchPriority="high"
        />
      </motion.div>

      {/* Cinematic gradient overlays */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-[#003d72]/95 via-[#07538b]/65 to-[#132c43]/15"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-slate-950/65 via-transparent to-slate-950/10"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-blue-950/20 via-transparent to-orange-400/15"
      />

      {/* Subtle decorative dots */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-5 top-8 -z-10 h-16 w-24 opacity-30 sm:left-10 sm:top-10"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.65) 1px, transparent 1px)",
          backgroundSize: "10px 10px",
        }}
      />

      {/* Decorative bottom-left curve */}
      <svg
        aria-hidden="true"
        viewBox="0 0 350 180"
        className="pointer-events-none absolute -bottom-12 -left-12 -z-10 w-64 opacity-50 sm:w-80"
        fill="none"
      >
        <path
          d="M-20 15 C70 45 140 90 350 180"
          stroke="#FF9B42"
          strokeWidth="1.5"
        />
        <path
          d="M-10 45 C80 75 145 115 320 190"
          stroke="#FF9B42"
          strokeWidth="0.7"
          opacity="0.6"
        />
      </svg>

      {/* Main content */}
      <div className="container-page relative mx-auto grid w-full items-center gap-10 py-24 sm:py-28 lg:grid-cols-[1fr_0.88fr] lg:gap-8 lg:py-20 xl:gap-12">
        {/* LEFT: Hero copy */}
        <div className="relative z-10 max-w-2xl text-white">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white shadow-sm backdrop-blur-md sm:text-[10px]"
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.8)]" />

            <span>
              {hero.eyebrow || "Humanity first · Building hope since 2014"}
            </span>

            <ArrowRight className="h-3 w-3 shrink-0" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.75,
              delay: 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="mt-5 max-w-xl font-display text-4xl font-extrabold leading-[1.06] tracking-[-0.04em] sm:text-5xl lg:text-[3.25rem] xl:text-6xl"
          >
            <span className="block">
              {hero.titlePrefix || "Small Acts."}
            </span>

            <span className="mt-1 block bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent">
              {hero.titleHighlight || "Life-Changing Impact."}
            </span>
          </motion.h1>

          {/* Orange hand-drawn underline */}
          <motion.svg
            aria-hidden="true"
            viewBox="0 0 300 14"
            preserveAspectRatio="none"
            className="mt-1 h-3 w-48 text-orange-400 sm:w-64"
            fill="none"
          >
            <motion.path
              d="M3 10 C65 -1 150 3 215 7 S270 11 297 5"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, delay: 0.6 }}
            />
          </motion.svg>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.2 }}
            className="mt-4 max-w-md text-xs leading-6 text-white/85 sm:text-sm sm:leading-7"
          >
            {hero.subtitle ||
              "Every family deserves dignity, every child deserves opportunity, and every act of kindness can change a life. Together, we turn compassion into meaningful action."}
          </motion.p>

          {/* Primary actions */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.3 }}
            className="mt-5 flex flex-wrap items-center gap-2.5"
          >
            <Link
              to={hero.primaryCtaLink || "/donate"}
              className="group inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-2.5 text-[11px] font-bold text-white shadow-lg shadow-orange-950/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-orange-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-950 sm:px-5 sm:text-xs"
            >
              <Heart className="h-3.5 w-3.5 fill-white" />

              {hero.primaryCta || "Make a Difference"}

              <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20 transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="h-3 w-3" />
              </span>
            </Link>

            <Link
              to="/volunteer"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-white/45 bg-white/10 px-4 py-2.5 text-[11px] font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/20 sm:px-5 sm:text-xs"
            >
              <HandHeart className="h-3.5 w-3.5" />
              Become a Volunteer
            </Link>
          </motion.div>

          {hero.secondaryCtaLink &&
            hero.secondaryCtaLink !== "/volunteer" && (
              <Link
                to={hero.secondaryCtaLink}
                className="mt-3 inline-flex items-center gap-2 text-[11px] font-medium text-white/90 transition-colors hover:text-orange-300 sm:text-xs"
              >
                {hero.secondaryCta || "Discover our mission"}
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}

          {/* Community trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/20 pt-4 sm:mt-7 sm:pt-5"
          >
          

            <div>
              {/* <div className="flex items-center gap-1.5 text-[11px] font-bold text-white sm:text-xs">
                <Heart className="h-3 w-3 fill-orange-400 text-orange-400" />
                Powered by compassion
              </div> */}

              <p className="mt-0.5 text-[9px] text-white/70 sm:text-[10px]">
                Every helping hand makes a difference.
              </p>
            </div>
          </motion.div>
        </div>

        {/* RIGHT: Floating impact statistics */}
        <div className="relative mx-auto hidden w-full max-w-lg lg:block">
          {/* People reached */}
          {featuredStats[0] && (
            <motion.div
              initial={{ opacity: 0, x: 20, y: -10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="absolute right-12 top-0 z-20 flex min-w-[150px] items-center gap-2.5 rounded-xl border border-white/80 bg-white/95 px-3 py-2.5 shadow-xl shadow-slate-950/15 backdrop-blur-xl xl:right-16"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                {(() => {
                  const Icon = featuredStats[0].icon;
                  return <Icon className="h-4 w-4" />;
                })()}
              </div>

              <div className="min-w-0">
                <p className="text-[8px] font-bold uppercase tracking-wide text-blue-600">
                  {featuredStats[0].label}
                </p>
                <p className="mt-0.5 text-sm font-extrabold text-slate-900">
                  {featuredStats[0].value}
                </p>
              </div>
            </motion.div>
          )}

          {/* Volunteers */}
          {featuredStats[1] && (
            <motion.div
              initial={{ opacity: 0, x: -20, y: 8 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="absolute left-0 top-24 z-20 flex min-w-[145px] items-center gap-2.5 rounded-xl border border-white/80 bg-white/95 px-3 py-2.5 shadow-xl shadow-slate-950/15 backdrop-blur-xl xl:top-28"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-orange-50 text-orange-600">
                {(() => {
                  const Icon = featuredStats[1].icon;
                  return <Icon className="h-4 w-4" />;
                })()}
              </div>

              <div className="min-w-0">
                <p className="text-[8px] font-bold uppercase tracking-wide text-orange-600">
                  {featuredStats[1].label}
                </p>
                <p className="mt-0.5 text-sm font-extrabold text-slate-900">
                  {featuredStats[1].value}
                </p>
              </div>
            </motion.div>
          )}

          {/* Image focal point remains unobstructed */}
          <div className="h-[390px] xl:h-[440px]" />

          {/* Aid delivered */}
          {featuredStats[2] && (
            <motion.div
              initial={{ opacity: 0, x: 20, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.7, delay: 0.75 }}
              className="absolute -right-1 top-[55%] z-20 flex min-w-[150px] items-center gap-2.5 rounded-xl border border-white/80 bg-white/95 px-3 py-2.5 shadow-xl shadow-slate-950/15 backdrop-blur-xl xl:-right-3"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                {(() => {
                  const Icon = featuredStats[2].icon;
                  return <Icon className="h-4 w-4" />;
                })()}
              </div>

              <div className="min-w-0">
                <p className="text-[8px] font-bold uppercase tracking-wide text-emerald-700">
                  {featuredStats[2].label}
                </p>
                <p className="mt-0.5 text-sm font-extrabold text-slate-900">
                  {featuredStats[2].value}
                </p>
              </div>
            </motion.div>
          )}

          {/* Bottom trust strip */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.85 }}
            className="absolute bottom-0 left-1/2 z-20 flex w-[calc(100%-1rem)] -translate-x-1/2 items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/95 px-4 py-3 shadow-xl shadow-slate-950/15 backdrop-blur-xl xl:px-5"
          >
            <div className="flex min-w-0 items-center gap-2">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-orange-100 text-orange-600">
                <Heart className="h-4 w-4 fill-orange-500" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-900">
                  People first
                </p>
                <p className="text-[8px] text-slate-500">
                  Dignity and care
                </p>
              </div>
            </div>

            <div className="h-8 w-px shrink-0 bg-slate-200" />

            <div className="flex min-w-0 items-center gap-2">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-600">
                <Users className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-900">
                  Stronger together
                </p>
                <p className="text-[8px] text-slate-500">
                  Community-led change
                </p>
              </div>
            </div>
          </motion.div>
        </div>
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
    <section className="relative isolate overflow-hidden bg-background py-16 sm:py-20 lg:py-24">
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-20 -z-10 h-80 w-80 rounded-full bg-brand-orange/[0.08] blur-[100px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-0 -z-10 h-96 w-96 rounded-full bg-brand-blue/[0.07] blur-[110px]"
      />

      <div className="container-page">
        <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16 xl:gap-20">
          {/* LEFT: Story content */}
          <Reveal>
            <div className="max-w-2xl">
              {/* Section label */}
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-orange/20 bg-brand-orange/[0.07] px-4 py-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-orange/50" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-orange" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-orange sm:text-xs">
                  {story.eyebrow || "Our story"}
                </span>
              </div>

              {/* Heading */}
              <h2 className="mt-6 font-display text-3xl font-bold leading-[1.12] tracking-tight text-foreground sm:text-4xl md:text-5xl xl:text-[3.5rem]">
                {title}{" "}
                <span className="relative inline-block text-gradient-brand">
                  {highlight}
                  <span className="absolute -bottom-1 left-0 h-1 w-2/3 rounded-full bg-brand-orange/30" />
                </span>
              </h2>

              {/* Description */}
              <p className="mt-6 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
                {story.body}
              </p>

              {/* Mission points */}
              {points.length > 0 && (
                <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                  {points.map((point, index) => (
                    <Reveal
                      key={`${point}-${index}`}
                      as="li"
                      delay={index * 0.08}
                      className="group flex items-start gap-3 rounded-2xl border border-border/60 bg-card/70 p-3.5 transition-all duration-300 hover:-translate-y-1 hover:border-brand-orange/30 hover:bg-brand-orange/[0.035] hover:shadow-md"
                    >
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-orange/10 text-brand-orange transition-colors duration-300 group-hover:bg-brand-orange group-hover:text-white">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                      <span className="pt-1 text-sm font-medium leading-6 text-foreground/85">
                        {point}
                      </span>
                    </Reveal>
                  ))}
                </ul>
              )}

              {/* CTA */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to={story.ctaLink || "/about"}
                  className="group inline-flex min-h-12 items-center gap-3 rounded-full bg-gradient-warm px-5 py-3 text-sm font-bold text-white shadow-warm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
                >
                  {story.cta || "Discover our story"}
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white/20 transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>

                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-brand-orange/20 bg-brand-orange/[0.06]">
                    <Heart className="h-4 w-4 fill-brand-orange/20 text-brand-orange" />
                  </span>
                  Compassion in action
                </div>
              </div>
            </div>
          </Reveal>

          {/* RIGHT: Image composition */}
          <Reveal
            delay={0.15}
            className="relative mx-auto w-full max-w-xl lg:max-w-none"
          >
            <div className="relative px-5 pb-9 pt-5 sm:px-8 sm:pb-12 sm:pt-8">
              {/* Decorative frame */}
              <div
                aria-hidden="true"
                className="absolute right-0 top-0 h-32 w-32 rounded-tr-[2.5rem] border-r-2 border-t-2 border-brand-orange/40 sm:h-44 sm:w-44"
              />
              <div
                aria-hidden="true"
                className="absolute bottom-2 left-0 h-28 w-28 rounded-bl-[2.5rem] border-b-2 border-l-2 border-brand-blue/25 sm:h-36 sm:w-36"
              />

              {/* Main image */}
              <div className="relative z-10 overflow-hidden rounded-[1.75rem] border border-white/70 bg-secondary shadow-2xl shadow-brand-blue/10 sm:rounded-[2.25rem]">
                <div className="relative aspect-[4/4.3] overflow-hidden sm:aspect-[5/4.5]">
                  <img
                    src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=85"
                    alt="Children sharing a moment of hope and happiness"
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  />

                  {/* Image overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-slate-950/5" />

                  {/* Image badge */}
                  <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/25 px-3 py-2 text-[10px] font-semibold text-white shadow-lg backdrop-blur-md sm:left-6 sm:top-6 sm:text-xs">
                    <Heart className="h-3.5 w-3.5 fill-brand-orange text-brand-orange" />
                    A mission with meaning
                  </div>

                  {/* Image text */}
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/75">
                      More than charity
                    </p>
                    <h3 className="mt-3 max-w-sm font-display text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
                      Creating hope.
                      <br />
                      Restoring dignity.
                      <br />
                      Changing lives.
                    </h3>
                    <div className="mt-5 h-1 w-14 rounded-full bg-brand-orange" />
                  </div>
                </div>
              </div>

              {/* Floating establishment card */}
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="absolute -left-1 top-12 z-20 w-40 rounded-2xl border border-white/80 bg-white/95 p-4 shadow-xl shadow-slate-900/10 backdrop-blur-xl sm:-left-2 sm:top-16 sm:w-48 sm:p-5"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-orange/10 text-brand-orange">
                  <HandHeart className="h-5 w-5" />
                </div>

                <p className="mt-3 font-display text-xl font-bold text-foreground sm:text-2xl">
                  {story.estLabel || "Est. 2014"}
                </p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  A journey rooted in kindness and community.
                </p>
              </motion.div>

              {/* Floating quote card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="relative z-20 -mt-5 ml-5 max-w-md rounded-2xl border border-border/70 bg-card p-4 shadow-xl shadow-slate-900/[0.07] sm:ml-12 sm:p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-blue/10 text-brand-blue">
                    <Quote className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <blockquote className="font-display text-sm font-semibold leading-6 text-foreground sm:text-base sm:leading-7">
                      {story.quote
                        ? `“${story.quote}”`
                        : "Every act of kindness has the power to change a life."}
                    </blockquote>

                    {story.quoteAttr && (
                      <p className="mt-2 text-xs font-medium text-muted-foreground">
                        — {story.quoteAttr}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-blue sm:text-xs">
                    Our guiding belief
                  </span>
                  <Heart className="h-4 w-4 fill-brand-orange/20 text-brand-orange" />
                </div>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}


/* ---------------- VALUES ---------------- */
function Values({ sections }: { sections: HomeSections }) {
  const principles = sections.principles ?? {};

  const VALUE_META = [
    {
      icon: Heart,
      color: "from-brand-accent to-brand-orange",
      soft: "bg-brand-orange/10",
    },
    {
      icon: Shield,
      color: "from-brand-blue to-brand-blue-light",
      soft: "bg-brand-blue/10",
    },
    {
      icon: Eye,
      color: "from-success to-brand-blue",
      soft: "bg-success/10",
    },
    {
      icon: Handshake,
      color: "from-brand-orange to-brand-accent",
      soft: "bg-brand-orange/10",
    },
    {
      icon: Lightbulb,
      color: "from-brand-blue-light to-brand-orange",
      soft: "bg-brand-blue/10",
    },
    {
      icon: Globe2,
      color: "from-brand-accent to-brand-blue",
      soft: "bg-brand-accent/10",
    },
  ];

  const values = (principles.items ?? []).map((item, index) => ({
    title: item.title || "",
    desc: item.desc || "",
    ...VALUE_META[index % VALUE_META.length],
    index: String(index + 1).padStart(2, "0"),
  }));

  return (
    <section className="relative isolate overflow-hidden bg-secondary/40 py-20 sm:py-24 lg:py-28">
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-brand-orange/[0.07] blur-[100px]" />
        <div className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-brand-blue/[0.07] blur-[110px]" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "radial-gradient(currentColor 0.7px, transparent 0.7px)",
            backgroundSize: "22px 22px",
          }}
        />
      </div>

      <div className="container-page relative mx-auto">
        {/* Section heading */}
        <Reveal className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-orange/20 bg-white/80 px-3.5 py-2 shadow-sm">
            <Heart className="h-3.5 w-3.5 text-brand-orange" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-orange sm:text-xs">
              {principles.eyebrow || "What we believe"}
            </span>
          </div>

          <h2 className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl">
            {principles.title || "The principles that"}{" "}
            <span className="text-gradient-brand">
              {principles.titleHighlight || "guide every act"}
            </span>
          </h2>

          {principles.subtitle && (
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
              {principles.subtitle}
            </p>
          )}
        </Reveal>

        {/* Values grid */}
        {values.length > 0 && (
          <div className="mt-12 grid gap-5 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;

              return (
                <Reveal
                  key={`${value.title}-${index}`}
                  delay={index * 0.08}
                  className="h-full"
                >
                  <article className="group relative flex h-full min-h-[245px] flex-col overflow-hidden rounded-3xl border border-border/80 bg-white p-6 shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:border-brand-orange/30 hover:shadow-xl hover:shadow-brand-blue/[0.06] sm:p-8">
                    {/* Hover wash */}
                    <div
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${value.color} opacity-0 transition-opacity duration-500 group-hover:opacity-[0.055]`}
                    />

                    {/* Decorative number */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute right-5 top-4 font-display text-5xl font-bold tracking-tight text-slate-100 transition-colors duration-500 group-hover:text-brand-orange/[0.10] sm:right-7 sm:top-5 sm:text-6xl"
                    >
                      {value.index}
                    </span>

                    {/* Icon */}
                    <div
                      className={`relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${value.color} text-white shadow-md transition-transform duration-500 group-hover:rotate-3 group-hover:scale-110`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    {/* Content */}
                    <div className="relative mt-6 flex-1">
                      <h3 className="font-display text-xl font-bold tracking-tight text-foreground transition-colors duration-300 group-hover:text-brand-blue sm:text-2xl">
                        {value.title}
                      </h3>

                      <p className="mt-3 text-sm leading-7 text-muted-foreground">
                        {value.desc}
                      </p>
                    </div>

                    {/* Bottom accent */}
                    <div className="relative mt-6 flex items-center justify-between">
                      <span
                        className={`h-1 w-10 rounded-full bg-gradient-to-r ${value.color} transition-all duration-500 group-hover:w-16`}
                      />

                      <span className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground transition-all duration-300 group-hover:border-brand-orange/30 group-hover:bg-brand-orange/10 group-hover:text-brand-orange">
                        <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        )}

        {/* Closing statement */}
        <Reveal delay={0.2} className="mt-12 sm:mt-14">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-cool px-6 py-8 text-center shadow-cool sm:px-10 sm:py-10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-brand-orange/20 blur-3xl"
            />

            <div className="relative mx-auto flex max-w-2xl flex-col items-center">
              <div className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/10 text-white">
                <Heart className="h-5 w-5 fill-white/20" />
              </div>

              <p className="mt-4 font-display text-xl font-semibold leading-relaxed text-white sm:text-2xl">
                Real change begins with the values we put into action.
              </p>

              <p className="mt-2 text-sm text-white/70">
                Every decision is an opportunity to serve with compassion.
              </p>
            </div>
          </div>
        </Reveal>
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
   <section className="relative isolate overflow-hidden py-24 md:py-28">
  {/* Background */}
  <div className="absolute inset-0 -z-20 bg-gradient-cool" />
  <div className="pointer-events-none absolute inset-0 -z-10 bg-mesh opacity-40" />

  <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-brand-orange/20 blur-3xl" />
  <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

  {/* Bottom wave */}
  <svg
    className="pointer-events-none absolute inset-x-0 bottom-0 w-full text-background"
    viewBox="0 0 1440 100"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <path
      fill="currentColor"
      d="M0,80 C240,20 480,120 720,60 C960,0 1200,100 1440,60 L1440,100 L0,100 Z"
    />
  </svg>

  <div className="container-page relative text-white">
    {/* Heading */}
    <Reveal className="mx-auto max-w-3xl text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-orange backdrop-blur-sm">
        <span className="h-2 w-2 rounded-full bg-brand-orange" />
        {impact.eyebrow || "Measured impact"}
      </span>

      <h2 className="mt-6 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
        {impact.title || "Numbers that represent"}{" "}
        <span className="text-gradient-warm">
          {impact.titleHighlight || "real people"}
        </span>
      </h2>

      <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
        {impact.body}
      </p>

      <div className="mx-auto mt-7 h-1 w-20 rounded-full bg-brand-orange" />
    </Reveal>

    {/* Statistics */}
    <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
      {stats.map((s, i) => (
        <Reveal key={`${s.label}-${i}`} delay={i * 0.12}>
          <div className="group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-7 text-center shadow-lg shadow-black/5 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-brand-orange/50 hover:bg-white/[0.1] hover:shadow-2xl hover:shadow-black/10 sm:p-8">
            {/* Hover glow */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-brand-orange/0 blur-3xl transition-all duration-500 group-hover:bg-brand-orange/20" />

            {/* Number */}
            <div className="relative font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-5xl">
              <span className="transition-colors duration-300 group-hover:text-brand-orange">
                <CountUpComponent
                  end={s.end}
                  duration={2.4}
                  separator=","
                  enableScrollSpy
                  scrollSpyOnce
                />
                {s.suffix}
              </span>
            </div>

            {/* Label */}
            <div className="relative mt-4 text-xs font-semibold uppercase leading-5 tracking-[0.15em] text-white/65 transition-colors duration-300 group-hover:text-white sm:text-sm">
              {s.label}
            </div>

            {/* Bottom accent */}
            <div className="absolute inset-x-8 bottom-0 h-[2px] origin-center scale-x-0 rounded-full bg-gradient-to-r from-transparent via-brand-orange to-transparent transition-transform duration-500 group-hover:scale-x-100" />
          </div>
        </Reveal>
      ))}
    </div>

    {/* Closing line */}
    <Reveal delay={0.3} className="mt-12 text-center">
      <p className="text-sm text-white/60">
        Every number represents a life touched and a community supported.
      </p>
    </Reveal>
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
    <section className="relative overflow-hidden py-24 md:py-28">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-brand-orange/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-10 h-80 w-80 rounded-full bg-brand-blue/10 blur-3xl" />

      <div className="container-page relative">
        {/* Section heading */}
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-orange/20 bg-brand-orange/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-orange">
            <MapPin className="h-3.5 w-3.5" />
            {mapCopy.eyebrow || "Our growing network"}
          </span>

          <h2 className="mt-6 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
            {mapCopy.title || "Local roots,"}{" "}
            <span className="text-gradient-brand">
              {mapCopy.titleHighlight || "global reach"}
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
  {mapCopy.body ||
    "Explore our local teams working together to support deserving families, strengthen communities, and create lasting positive change."}
</p>
        </Reveal>

        {/* Main layout */}
        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-[1.35fr_0.85fr]">
          {/* Interactive map */}
          <Reveal className="min-w-0">
            <div className="group relative h-full min-h-[390px] overflow-hidden rounded-3xl border border-border bg-gradient-cool p-5 shadow-cool sm:p-7">
              <div className="pointer-events-none absolute inset-0 bg-mesh opacity-30" />

              {/* Map header */}
              <div className="relative z-10 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                    Chapter network
                  </p>
                  <h3 className="mt-1 font-display text-xl font-bold text-white">
                    Find our communities
                  </h3>
                </div>

                <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs text-white/80 backdrop-blur">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-brand-orange" />
                  {pins.length} {pins.length === 1 ? "chapter" : "chapters"}
                </div>
              </div>

              {/* SVG map */}
              <div className="relative mt-6">
                {loading ? (
                  <div className="grid min-h-[260px] place-items-center text-white/80">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-7 w-7 animate-spin text-brand-orange" />
                      <span className="text-sm">Loading chapters...</span>
                    </div>
                  </div>
                ) : (
                  <svg
                    viewBox="0 0 100 60"
                    className="h-auto min-h-[240px] w-full overflow-visible"
                    role="img"
                    aria-label="Interactive chapter location map"
                  >
                    <defs>
                      <pattern
                        id="chapters-grid"
                        width="4"
                        height="4"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M4 0 L0 0 0 4"
                          fill="none"
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth="0.2"
                        />
                      </pattern>

                      <linearGradient
                        id="chapter-land"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.12" />
                        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.035" />
                      </linearGradient>

                      <filter id="chapter-glow">
                        <feGaussianBlur stdDeviation="1.2" />
                      </filter>
                    </defs>

                    <rect
                      width="100"
                      height="60"
                      rx="2"
                      fill="url(#chapters-grid)"
                    />

                    {/* Decorative land-like shapes */}
                    {[
                      "M7,19 Q12,12 21,16 L30,20 Q35,25 30,32 L25,38 Q18,43 13,36 L8,30 Z",
                      "M34,15 Q42,9 49,15 L55,20 L52,27 L46,31 L39,27 L34,21 Z",
                      "M49,30 Q56,24 62,29 L66,38 L60,47 L54,42 L50,36 Z",
                      "M65,17 Q76,12 83,19 L92,26 L88,35 L78,39 L70,32 L66,25 Z",
                    ].map((d, i) => (
                      <path
                        key={i}
                        d={d}
                        fill="url(#chapter-land)"
                        stroke="rgba(255,255,255,0.09)"
                        strokeWidth="0.25"
                      />
                    ))}

                    {/* Decorative connection lines */}
                    {pins.map((p, i) => {
                      if (i === 0) return null;

                      const first = pins[0];

                      return (
                        <line
                          key={`connection-${i}`}
                          x1={first.x}
                          y1={first.y}
                          x2={p.x}
                          y2={p.y}
                          stroke="#F89C1B"
                          strokeWidth="0.25"
                          strokeDasharray="1.5 1.5"
                          opacity="0.35"
                        />
                      );
                    })}

                    {/* Location pins */}
                    {pins.map((p, i) => {
                      const isActive = i === active;

                      return (
                        <g
                          key={`${p.name}-${i}`}
                          transform={`translate(${p.x} ${p.y})`}
                          onMouseEnter={() => setActive(i)}
                          onClick={() => setActive(i)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setActive(i);
                            }
                          }}
                          tabIndex={0}
                          role="button"
                          aria-label={`Show ${p.name} chapter`}
                          aria-pressed={isActive}
                          className="cursor-pointer outline-none"
                        >
                          {/* Outer pulse */}
                          <circle
                            r={isActive ? 4 : 2.5}
                            fill="#F89C1B"
                            opacity="0.2"
                          >
                            <animate
                              attributeName="r"
                              values={isActive ? "3;6;3" : "2;4;2"}
                              dur="2s"
                              repeatCount="indefinite"
                            />
                            <animate
                              attributeName="opacity"
                              values="0.35;0.05;0.35"
                              dur="2s"
                              repeatCount="indefinite"
                            />
                          </circle>

                          {/* Glow */}
                          {isActive && (
                            <circle
                              r="2.5"
                              fill="#F89C1B"
                              opacity="0.45"
                              filter="url(#chapter-glow)"
                            />
                          )}

                          {/* Pin center */}
                          <circle
                            r={isActive ? 1.6 : 1.15}
                            fill="#F89C1B"
                            stroke="white"
                            strokeWidth="0.3"
                          />

                          {/* Location label */}
                          <text
                            y="-3.2"
                            textAnchor="middle"
                            fontSize={isActive ? "2.2" : "1.8"}
                            fill="white"
                            opacity={isActive ? 1 : 0.7}
                            fontWeight={isActive ? 700 : 500}
                            paintOrder="stroke"
                            stroke="rgba(20,30,50,0.65)"
                            strokeWidth="0.35"
                            strokeLinejoin="round"
                          >
                            {p.name.length > 15
                              ? `${p.name.slice(0, 13)}…`
                              : p.name}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                )}
              </div>

              {/* Map footer */}
              <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-white/60">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-brand-orange" />
                  Select a pin to explore a chapter
                </span>
                <span>Stronger communities, together.</span>
              </div>
            </div>
          </Reveal>

          {/* Chapter details */}
          <Reveal delay={0.15}>
            <div className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-shadow duration-300 hover:shadow-xl">
              {current ? (
                <>
                  {/* Chapter image */}
                  <div className="relative h-44 overflow-hidden bg-secondary sm:h-48">
                    {current.imageUrl ? (
                      <img
                        src={current.imageUrl}
                        alt={`${current.name} chapter`}
                        className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="relative grid h-full place-items-center bg-gradient-cool">
                        <div className="absolute inset-0 bg-mesh opacity-30" />
                        <div className="relative grid h-16 w-16 place-items-center rounded-2xl border border-white/20 bg-white/10 text-white shadow-lg backdrop-blur">
                          <MapPin className="h-8 w-8" />
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">
                          Featured chapter
                        </span>
                        <h3 className="mt-1 font-display text-2xl font-bold text-white">
                          {current.name}
                        </h3>
                      </div>

                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/15 text-white backdrop-blur">
                        <MapPin className="h-5 w-5" />
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    {/* Chapter details */}
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-orange/10 text-brand-orange">
                        <Users className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                          Chapter leadership
                        </p>
                        <p className="truncate text-sm font-semibold text-foreground">
                          {current.president === "TBD"
                            ? "Leadership to be announced"
                            : current.president}
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-border bg-secondary/60 p-4 transition-colors hover:border-brand-orange/40">
                        <Users className="mb-3 h-5 w-5 text-brand-orange" />
                        <div className="font-display text-2xl font-bold text-foreground">
                          {current.members.toLocaleString()}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Team members
                        </p>
                      </div>

                      <div className="rounded-2xl border border-border bg-secondary/60 p-4 transition-colors hover:border-brand-orange/40">
                        <Heart className="mb-3 h-5 w-5 text-brand-orange" />
                        <div className="font-display text-2xl font-bold text-foreground">
                          {current.projects.toLocaleString()}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Projects / cases
                        </p>
                      </div>
                    </div>

                    {/* Chapter selector */}
                    <div className="mt-6 flex-1">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                          Explore chapters
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {pins.length} available
                        </span>
                      </div>

                      <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
                        {pins.map((p, i) => (
                          <button
                            key={`${p.name}-${i}`}
                            type="button"
                            onClick={() => setActive(i)}
                            aria-pressed={i === active}
                            className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all duration-200 ${
                              i === active
                                ? "border-brand-orange/30 bg-brand-orange/10 text-foreground"
                                : "border-transparent text-muted-foreground hover:border-border hover:bg-secondary hover:text-foreground"
                            }`}
                          >
                            <span
                              className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors ${
                                i === active
                                  ? "bg-brand-orange text-white"
                                  : "bg-secondary text-muted-foreground group-hover:text-brand-orange"
                              }`}
                            >
                              <MapPin className="h-4 w-4" />
                            </span>

                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold">
                                {p.name}
                              </span>
                              <span className="mt-0.5 block text-xs text-muted-foreground">
                                {p.members} members
                              </span>
                            </span>

                            <ChevronRight
                              className={`h-4 w-4 shrink-0 transition-transform ${
                                i === active
                                  ? "translate-x-0.5 text-brand-orange"
                                  : "text-muted-foreground"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid min-h-[360px] flex-1 place-items-center p-8 text-center">
                  <div>
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
                      <MapPin className="h-7 w-7" />
                    </div>
                    <h3 className="mt-4 font-display text-xl font-bold">
                      No chapters yet
                    </h3>
                    <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                      New chapters will appear here as they join our network.
                    </p>
                  </div>
                </div>
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
  const programs = [
    {
      number: "01",
      title: "Food Packages",
      description:
        "Providing essential ration to deserving families facing financial hardship.",
      icon: Utensils,
      color: "orange",
      featured: true,
    },
    {
      number: "02",
      title: "Education",
      description:
        "Supporting deserving students with educational expenses and learning opportunities.",
      icon: GraduationCap,
      color: "blue",
    },
    {
      number: "03",
      title: "Healthcare",
      description:
        "Helping deserving patients with medical expenses and essential healthcare.",
      icon: Stethoscope,
      color: "green",
    },
    {
      number: "04",
      title: "Rozgar Scheme",
      description:
        "Helping deserving individuals start or sustain small businesses.",
      icon: LifeBuoy,
      color: "purple",
      featured: true,
    },
    {
      number: "05",
      title: "Orphan Care",
      description:
        "Supporting orphan girls with dowry assistance and essential needs.",
      icon: Baby,
      color: "pink",
    },
    {
      number: "06",
      title: "Palestine drive",
      description:
        "Providing humanitarian aid and essential support to affected families.",
      icon: Heart,
      color: "coral",
    },
    {
      number: "07",
      title: "Winter Drive",
      description:
        "Providing warm clothes and winter essentials to families in need.",
      icon: Droplets,
      color: "sky",
    },
    {
      number: "08",
      title: "Flood Drive",
      description:
        "Providing emergency relief and essential supplies to flood-affected communities.",
      icon: Lightbulb,
      color: "amber",
    },
  ];

  const colorStyles: Record<
    string,
    {
      icon: string;
      line: string;
      background: string;
    }
  > = {
    orange: {
      icon: "bg-orange-500",
      line: "bg-orange-500",
      background: "from-orange-50/70 to-white",
    },
    blue: {
      icon: "bg-sky-500",
      line: "bg-sky-500",
      background: "from-sky-50/70 to-white",
    },
    green: {
      icon: "bg-emerald-500",
      line: "bg-emerald-500",
      background: "from-emerald-50/70 to-white",
    },
    purple: {
      icon: "bg-violet-500",
      line: "bg-violet-500",
      background: "from-violet-50/70 to-white",
    },
    pink: {
      icon: "bg-pink-500",
      line: "bg-pink-500",
      background: "from-pink-50/70 to-white",
    },
    coral: {
      icon: "bg-rose-500",
      line: "bg-gradient-to-r from-rose-500 to-orange-400",
      background: "from-rose-50/70 to-white",
    },
    sky: {
      icon: "bg-sky-500",
      line: "bg-sky-500",
      background: "from-sky-50/70 to-white",
    },
    amber: {
      icon: "bg-amber-500",
      line: "bg-amber-500",
      background: "from-amber-50/70 to-white",
    },
  };

  return (
    <section className="relative overflow-hidden bg-slate-50/70 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* Section heading */}
        <div className="mb-10 flex flex-col gap-4 sm:mb-12 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="mb-3 inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
              What We Do
            </span>

            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Our{" "}
              <span className="text-gradient-brand">
                Programs
              </span>
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
              Together, we create opportunities, support deserving families,
              and bring meaningful change to communities.
            </p>
          </div>
        </div>

        {/* Programs grid */}
        <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {programs.map((program) => {
            const Icon = program.icon;
            const colors = colorStyles[program.color];
            const featured = program.featured;

            return (
              <article
                key={program.number}
                className={[
                  "group relative flex min-w-0 flex-col overflow-hidden rounded-[26px]",
                  "border border-slate-200/80 shadow-sm",
                  "transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
                  featured
                    ? "min-h-[260px] bg-gradient-to-br from-[#3d5e9d] to-[#31559b] p-6 text-white sm:min-h-[280px] sm:p-7 lg:min-h-[300px]"
                    : `min-h-[220px] bg-gradient-to-br ${colors.background} p-5 text-slate-800 sm:min-h-[230px] sm:p-6`,
                  program.number === "01"
                    ? "lg:col-span-2 lg:row-span-2 lg:min-h-[380px] lg:p-8"
                    : "",
                  program.number === "04"
                    ? "lg:col-span-2 lg:min-h-[180px]"
                    : "",
                ].join(" ")}
              >
                {/* Background number */}
                <span
                  aria-hidden="true"
                  className={[
                    "pointer-events-none absolute right-5 top-4 select-none",
                    "text-5xl font-black leading-none tracking-tight",
                    featured ? "text-white/[0.12]" : "text-slate-300/35",
                  ].join(" ")}
                >
                  {program.number}
                </span>

                {/* Icon */}
                <div className="relative z-10 flex items-start justify-between">
                  <div
                    className={[
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                      "text-white shadow-lg transition-transform duration-300 group-hover:scale-110",
                      colors.icon,
                    ].join(" ")}
                  >
                    <Icon size={21} strokeWidth={1.9} />
                  </div>

                  <div
                    className={[
                      "flex h-9 w-9 items-center justify-center rounded-full border",
                      "transition-all duration-300 group-hover:translate-x-1",
                      featured
                        ? "border-white/20 text-white/80"
                        : "border-slate-200/70 text-slate-400",
                    ].join(" ")}
                  >
                    <ChevronRight size={18} />
                  </div>
                </div>

                {/* Card text */}
                <div className="relative z-10 mt-auto pt-8">
                  <div
                    className={[
                      "mb-3 h-1 w-8 rounded-full",
                      colors.line,
                    ].join(" ")}
                  />

                  <h3
                    className={[
                      "break-words font-extrabold tracking-tight",
                      featured
                        ? "text-2xl leading-tight sm:text-3xl"
                        : "text-lg leading-snug sm:text-xl",
                    ].join(" ")}
                  >
                    {program.title}
                  </h3>

                  <p
                    className={[
                      "mt-3 max-w-xl text-sm leading-6",
                      featured ? "text-white/80" : "text-slate-500",
                    ].join(" ")}
                  >
                    {program.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        {/* Bottom message */}
        <div className="mt-7 flex flex-col gap-5 rounded-[26px] border border-slate-200/70 bg-white/80 p-5 shadow-sm sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:p-6 lg:px-8 lg:py-7">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-500">
              <Heart size={21} strokeWidth={1.8} />
            </div>

            <div className="min-w-0">
              <h3 className="text-base font-extrabold leading-6 text-slate-800">
                Every action makes a difference.
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Together, we can build stronger, more caring communities.
              </p>
            </div>
          </div>

          <div className="shrink-0 self-start rounded-full border border-orange-200 bg-orange-50/50 px-4 py-2 sm:self-center">
            <span className="text-xs font-bold text-orange-500">
              One community at a time
            </span>
          </div>
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
  
<section className="relative overflow-hidden py-20 sm:py-24 lg:py-28">
  <div className="container-page">
    {/* Section heading */}
    <Reveal className="mx-auto max-w-3xl text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-brand-orange/20 bg-brand-orange/5 px-4 py-2">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" />
        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-orange sm:text-xs">
          Our Process
        </span>
      </div>

      <h2 className="mt-6 font-display text-3xl font-bold leading-[1.15] tracking-tight text-foreground sm:text-4xl lg:text-5xl">
        How every donation
        <span className="mt-1 block text-gradient-brand">
          reaches a life
        </span>
      </h2>

      <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
        Every contribution begins with compassion and follows a
        transparent process to reach the people who need it most.
      </p>
    </Reveal>

    {/* Timeline */}
    <div className="relative mx-auto mt-16 max-w-5xl sm:mt-20 lg:mt-24">
      {/* Timeline line */}
      <div className="absolute bottom-10 left-1/2 top-10 hidden w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-brand-orange/30 to-transparent md:block" />

      <div className="space-y-12 sm:space-y-16 lg:space-y-20">
        {steps.map((s, i) => {
          const StepIcon = s.icon;
          const isReversed = i % 2 === 1;

          return (
            <Reveal key={s.title} delay={i * 0.12}>
              <div
                className={`relative grid grid-cols-1 items-center gap-5 md:grid-cols-[1fr_100px_1fr] md:gap-0 ${
                  isReversed ? "" : ""
                }`}
              >
                {/* Left column */}
                <div
                  className={`min-w-0 ${
                    isReversed
                      ? "md:col-start-3 md:row-start-1 md:pl-10"
                      : "md:col-start-1 md:row-start-1 md:pr-10 md:text-right"
                  }`}
                >
                  <div
                    className={`flex flex-col ${
                      isReversed
                        ? "md:items-start md:text-left"
                        : "md:items-end md:text-right"
                    }`}
                  >
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-orange">
                      Step {String(i + 1).padStart(2, "0")}
                    </span>

                    <h3 className="mt-3 font-display text-xl font-bold leading-snug tracking-tight text-foreground sm:text-2xl lg:text-3xl">
                      {s.title}
                    </h3>

                    <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground sm:text-base">
                      {s.desc}
                    </p>
                  </div>
                </div>

                {/* Center icon */}
                <div className="flex items-center md:col-start-2 md:row-start-1 md:justify-center">
                  <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-brand-orange/20 bg-background shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(0,0,0,0.10)] sm:h-16 sm:w-16">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-warm text-white sm:h-12 sm:w-12">
                      <StepIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                  </div>
                </div>

                {/* Empty opposite column for alternating layout */}
                <div
                  className={`hidden md:block ${
                    isReversed
                      ? "md:col-start-1 md:row-start-1"
                      : "md:col-start-3 md:row-start-1"
                  }`}
                  aria-hidden="true"
                />
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>

    {/* Closing statement */}
    <Reveal className="mx-auto mt-16 max-w-3xl sm:mt-20">
      <div className="flex flex-col items-center gap-3 border-t border-border/70 pt-8 text-center sm:pt-10">
        <div className="h-1 w-10 rounded-full bg-gradient-warm" />

        <p className="font-display text-lg font-semibold text-foreground sm:text-xl">
          Small acts of kindness create lasting change.
        </p>

        <p className="max-w-lg text-sm leading-6 text-muted-foreground">
          Your support helps us turn generosity into real impact,
          one life and one family at a time.
        </p>
      </div>
    </Reveal>
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
    {
      id: string;
      title: string;
      date: string;
      dateIso?: string | null;
      location: string;
      days: number;
    }[]
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
    <section className="relative overflow-hidden py-16 sm:py-20 lg:py-24">
      {/* Soft background accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-brand-orange/5 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-10 h-72 w-72 rounded-full bg-brand-blue/5 blur-3xl"
      />

      <div className="container-page relative">
        {/* Section header */}
        <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-orange/20 bg-brand-orange/5 px-4 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-orange sm:text-xs">
                {hero.eyebrow || "Upcoming events"}
              </span>
            </div>

            <h2 className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {titleLead}{" "}
              <span className="text-gradient-brand">{highlight}</span>
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
              Join our community initiatives and help turn compassion into
              meaningful action.
            </p>
          </div>

          <Link
            to="/events"
            className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-all duration-300 hover:border-brand-orange/40 hover:text-brand-orange"
          >
            Explore all events
            <span aria-hidden="true">→</span>
          </Link>
        </Reveal>

        {/* Event cards */}
        <div className="mt-10 grid grid-cols-1 items-stretch gap-5 sm:mt-12 md:grid-cols-2 xl:grid-cols-3">
          {items.map((e, i) => {
            const days = daysUntilEvent(e.dateIso, e.days);

            return (
              <Reveal key={e.id} delay={i * 0.12}>
                <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[26px] border border-border/70 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-orange/30 hover:shadow-xl sm:p-7">
                  {/* Decorative accent */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-bl-[100px] bg-gradient-to-bl from-brand-orange/10 to-transparent transition-transform duration-500 group-hover:scale-110"
                  />

                  {/* Event date */}
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-orange/10 text-brand-orange">
                        <Calendar className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                          Event date
                        </p>
                        <p className="mt-1 break-words text-sm font-bold text-foreground">
                          {e.date || "Date to be announced"}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-600">
                      Upcoming
                    </span>
                  </div>

                  {/* Event information */}
                  <div className="relative mt-7 flex-1">
                    <h3 className="break-words font-display text-xl font-bold leading-snug tracking-tight text-foreground transition-colors group-hover:text-brand-blue sm:text-2xl">
                      {e.title}
                    </h3>

                    <div className="mt-4 flex items-start gap-2.5 text-sm leading-6 text-muted-foreground">
                      <MapPin className="mt-1 h-4 w-4 shrink-0 text-brand-orange" />
                      <span className="break-words">
                        {e.location || "Location to be announced"}
                      </span>
                    </div>
                  </div>

                  {/* Countdown */}
                  <div className="relative mt-7 flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-secondary/60 p-4">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Clock className="h-4 w-4 shrink-0 text-brand-blue" />
                      <span className="text-xs font-medium text-muted-foreground sm:text-sm">
                        {days === 0
                          ? "Event day"
                          : days > 0
                            ? "Time remaining"
                            : "Event passed"}
                      </span>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="font-display text-2xl font-bold leading-none text-brand-blue">
                        {Math.abs(days)}
                      </span>
                      <span className="ml-1 text-xs font-medium text-muted-foreground">
                        {Math.abs(days) === 1 ? "day" : "days"}
                      </span>
                    </div>
                  </div>

                  {/* Registration action */}
                  <Link
                    to="/events"
                    className="relative mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-warm px-5 py-3 text-sm font-bold text-white shadow-warm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    View event & register
                    <span aria-hidden="true">→</span>
                  </Link>
                </article>
              </Reveal>
            );
          })}
        </div>

        {/* Bottom note */}
        <div className="mt-8 flex flex-col gap-2 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-muted-foreground">
            Every event is an opportunity to make a difference.
          </p>

          <Link
            to="/events"
            className="text-sm font-semibold text-brand-blue transition-colors hover:text-brand-orange"
          >
            Find your way to help →
          </Link>
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
   
<section className="relative overflow-hidden py-16 sm:py-20 lg:py-24">
  {/* Background accents */}
  <div
    aria-hidden="true"
    className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-brand-orange/[0.06] blur-3xl"
  />
  <div
    aria-hidden="true"
    className="pointer-events-none absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-brand-blue/[0.05] blur-3xl"
  />

  {/* Heading */}
  <div className="container-page relative">
    <Reveal className="mx-auto max-w-3xl px-4 text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-brand-orange/20 bg-brand-orange/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-orange sm:text-xs">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" />
        {block.eyebrow || "Voices"}
      </span>

      <h2 className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
        {block.title || "Stories from the"}{" "}
        <span className="text-gradient-brand">
          {block.titleHighlight || "people we serve"}
        </span>
      </h2>

      <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
        Real experiences from people who support our mission and the
        communities we work alongside.
      </p>
    </Reveal>
  </div>

  {/* Testimonials marquee */}
  {t.length > 0 && (
    <div className="group relative mt-12 overflow-hidden sm:mt-16 lg:mt-20">
      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-background to-transparent sm:w-16 lg:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background to-transparent sm:w-16 lg:w-24" />

      <div className="flex w-max animate-marquee items-stretch gap-4 px-2 sm:gap-5">
        {row.map((r, i) => (
          <article
            key={`${r.name}-${i}`}
            aria-hidden={i >= t.length}
            className="relative flex w-[280px] shrink-0 flex-col overflow-hidden rounded-[24px] border border-border/70 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-orange/30 hover:shadow-lg sm:w-[340px] sm:p-7"
          >
            {/* Quote decoration */}
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-orange/10 text-brand-orange">
                <Quote className="h-5 w-5" />
              </div>

              <div className="flex items-center gap-0.5 text-brand-orange">
                {Array.from({ length: r.stars }).map((_, si) => (
                  <Star
                    key={si}
                    className="h-3.5 w-3.5 fill-current"
                  />
                ))}
              </div>
            </div>

            {/* Review */}
            <p className="mt-5 flex-1 break-words text-sm leading-7 text-foreground/80">
              “{r.text}”
            </p>

            {/* Reviewer */}
            <div className="mt-6 flex items-center gap-3 border-t border-border/70 pt-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-warm font-display text-base font-bold text-white">
                {r.name?.charAt(0)?.toUpperCase() || "V"}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">
                  {r.name}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {r.role || "Community member"}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )}

  {/* Review submission */}
  <div className="container-page relative mt-16 sm:mt-20 lg:mt-24">
    <Reveal className="mx-auto max-w-3xl">
      <div className="overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-sm">
        {/* Form header */}
        <div className="border-b border-border/70 px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-orange/10 text-brand-orange">
              <Quote className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h3 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Share your experience
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Your feedback helps us build trust and improve our work.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-brand-orange/15 bg-brand-orange/[0.04] px-4 py-3">
            <p className="text-xs leading-6 text-muted-foreground sm:text-sm">
              Reviews appear on the website after CEO approval.
            </p>
          </div>
        </div>

        {/* Form fields */}
        <form
          onSubmit={submitReview}
          className="space-y-5 px-5 py-6 sm:px-8 sm:py-8 lg:px-10"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="block min-w-0">
              <span className="mb-2 block text-sm font-semibold text-foreground">
                Name <span className="text-brand-orange">*</span>
              </span>

              <input
                required
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Enter your name"
                className="min-h-12 w-full min-w-0 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/70 focus:border-brand-orange focus:bg-background focus:ring-4 focus:ring-brand-orange/10"
              />
            </label>

            <label className="block min-w-0">
              <span className="mb-2 block text-sm font-semibold text-foreground">
                Role <span className="font-normal text-muted-foreground">(optional)</span>
              </span>

              <input
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role: e.target.value }))
                }
                placeholder="Volunteer, Donor..."
                className="min-h-12 w-full min-w-0 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/70 focus:border-brand-orange focus:bg-background focus:ring-4 focus:ring-brand-orange/10"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-foreground">
              Your review <span className="text-brand-orange">*</span>
            </span>

            <textarea
              required
              rows={5}
              value={form.text}
              onChange={(e) =>
                setForm((f) => ({ ...f, text: e.target.value }))
              }
              placeholder="Tell us about your experience..."
              className="w-full resize-y rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm leading-7 text-foreground outline-none transition-all placeholder:text-muted-foreground/70 focus:border-brand-orange focus:bg-background focus:ring-4 focus:ring-brand-orange/10"
            />
          </label>

          {/* Star rating */}
          <label className="block max-w-xs">
            <span className="mb-2 block text-sm font-semibold text-foreground">
              Your rating
            </span>

            <select
              value={form.stars}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  stars: Number(e.target.value) || 5,
                }))
              }
              className="min-h-12 w-full rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-brand-orange focus:bg-background focus:ring-4 focus:ring-brand-orange/10"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "Star" : "Stars"}
                </option>
              ))}
            </select>
          </label>

          {/* Status messages */}
          {formErr ? (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
            >
              {formErr}
            </p>
          ) : null}

          {formMsg ? (
            <p
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700"
            >
              {formMsg}
            </p>
          ) : null}

          {/* Submit */}
          <div className="flex flex-col gap-4 border-t border-border/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-sm text-xs leading-5 text-muted-foreground">
              Thank you for taking the time to share your feedback.
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-warm px-7 py-3 text-sm font-bold text-white shadow-warm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit review
                  <span aria-hidden="true">→</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
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

<section className="relative overflow-hidden py-16 sm:py-20 lg:py-24">
  <div className="container-page">
    <div className="relative isolate overflow-hidden rounded-[28px] border border-white/10 bg-gradient-cool shadow-cool sm:rounded-[36px]">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 bg-mesh opacity-30" />

      <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-brand-orange/20 blur-3xl" />

      <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-white/[0.08] blur-3xl" />

      <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* Main content */}
      <div className="relative grid gap-8 px-5 py-10 sm:px-8 sm:py-12 md:px-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12 lg:px-14 lg:py-16 xl:px-16">
        {/* Text content */}
        <div className="min-w-0 max-w-2xl text-white">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-orange sm:text-xs">
              {donate.eyebrow || "Make a difference today"}
            </span>
          </div>

          <h2 className="mt-6 max-w-2xl font-display text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl xl:text-[3.5rem]">
            {donate.title || "Your donation,"}{" "}
            <span className="text-gradient-warm">
              {donate.titleHighlight || "multiplied by love"}
            </span>
          </h2>

          <p className="mt-5 max-w-xl text-sm leading-7 text-white/70 sm:text-base sm:leading-8">
            {donate.body ||
              "Every donation is tracked, verified and delivered through our chapter network."}
          </p>

          {/* Trust indicators */}
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs font-medium text-white/75 sm:text-sm">
            <span className="inline-flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                ✓
              </span>
              Verified assistance
            </span>

            <span className="inline-flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                ✓
              </span>
              Transparent process
            </span>
          </div>
        </div>

        {/* Donation action */}
        <div className="flex w-full flex-col items-stretch gap-4 sm:flex-row sm:items-center lg:w-auto lg:flex-col lg:items-center">
          <div className="w-full rounded-2xl border border-white/10 bg-white/[0.06] p-4 sm:p-5 lg:w-[250px]">
            <p className="text-center text-xs leading-6 text-white/65">
              Your support can bring hope to a family in need.
            </p>

            <div className="mt-4 flex justify-center">
              <DonateAccountButton
                label={donate.cta || "Donate now"}
                className="w-full min-w-0 justify-center"
              />
            </div>
          </div>

          <p className="text-center text-[11px] leading-5 text-white/50 lg:max-w-[250px]">
            Every contribution helps us continue our welfare initiatives.
          </p>
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
        .map((partner) => ({
          name: partner.name || "",
          logoUrl: partner.logoUrl || "",
        }))
        .filter((partner) => partner.name || partner.logoUrl);
    }

    if (partners.names?.length) {
      return partners.names
        .filter(Boolean)
        .map((name) => ({ name, logoUrl: "" }));
    }

    return [];
  })();

  if (!items.length) return null;

  // Duplicate the list to create a continuous marquee.
  const repeatedItems =
    items.length < 6
      ? [...items, ...items, ...items, ...items]
      : [...items, ...items];

  return (
    <section className="relative isolate overflow-hidden border-y border-border/70 bg-white py-14 sm:py-16 md:py-20">
      {/* Soft background accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-28 top-0 h-64 w-64 rounded-full bg-brand-orange/[0.07] blur-[90px]" />
        <div className="absolute -right-28 bottom-0 h-64 w-64 rounded-full bg-brand-blue/[0.07] blur-[90px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-blue/20 to-transparent" />
      </div>

      {/* Section heading */}
      <div className="container-page relative mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-blue/10 bg-brand-blue/[0.04] px-3.5 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue sm:text-xs">
              Our community
            </span>
          </div>

          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            {partners.title || "Good things happen when we work together."}
          </h2>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">
            Meaningful change is made possible by the people and organizations
            who believe in a better future for everyone.
          </p>
        </motion.div>
      </div>

      {/* Partner marquee */}
      <div className="relative mt-9 sm:mt-12">
        {/* Edge fades */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white to-transparent sm:w-24 md:w-36"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white to-transparent sm:w-24 md:w-36"
        />

        <div className="group/marquee overflow-hidden py-4">
          <div
            className="flex w-max items-center gap-4 motion-safe:animate-marquee group-hover/marquee:[animation-play-state:paused] group-focus-within/marquee:[animation-play-state:paused] sm:gap-5 md:gap-6"
            style={{
              width: "max-content",
            }}
          >
            {repeatedItems.map((partner, index) => (
              <div
                key={`${partner.name}-${index}`}
                aria-hidden={index >= items.length ? true : undefined}
                title={partner.name || undefined}
                className="group/card flex h-28 w-40 shrink-0 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-orange/30 hover:shadow-lg hover:shadow-brand-orange/[0.06] sm:h-32 sm:w-48 sm:rounded-3xl sm:px-5"
              >
                {/* Logo container */}
                <div className="flex h-14 w-full items-center justify-center sm:h-16">
                  {partner.logoUrl ? (
                    <img
                      src={partner.logoUrl}
                      alt={index < items.length ? partner.name || "Partner logo" : ""}
                      loading="lazy"
                      className="max-h-12 max-w-[85%] object-contain opacity-75 grayscale transition-all duration-300 group-hover/card:scale-105 group-hover/card:opacity-100 group-hover/card:grayscale-0 sm:max-h-14"
                    />
                  ) : (
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-cool font-display text-sm font-bold text-white shadow-sm transition-transform duration-300 group-hover/card:scale-105 sm:h-14 sm:w-14">
                      {(partner.name || "?").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                {partner.name ? (
                  <span className="max-w-full truncate text-center text-[11px] font-semibold tracking-wide text-slate-500 transition-colors duration-300 group-hover/card:text-brand-blue sm:text-xs">
                    {partner.name}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Supporting note */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="mt-5 text-center text-xs font-medium text-muted-foreground sm:text-sm"
      >
        United by compassion. Stronger through collaboration.
      </motion.p>
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
      <div className="sh-home-redesign">
        <style>{`
          .sh-home-redesign { --sh-ink: #101c2c; --sh-muted: #667085; color: var(--sh-ink); overflow: clip; }
          .sh-home-redesign section { scroll-margin-top: 6rem; }
          .sh-home-redesign .container-page { width: min(100% - 2rem, 80rem); margin-inline: auto; }
          @media (min-width: 640px) { .sh-home-redesign .container-page { width: min(100% - 3rem, 80rem); } }
          .sh-home-redesign section:not(:first-child) { position: relative; }
          .sh-home-redesign section:nth-of-type(even) { background-color: #f8fafc; }
          .sh-home-redesign h2 { text-wrap: balance; letter-spacing: -.035em; }
          .sh-home-redesign p { text-wrap: pretty; }
          .sh-home-redesign a, .sh-home-redesign button { -webkit-tap-highlight-color: transparent; }
          .sh-home-redesign a:focus-visible, .sh-home-redesign button:focus-visible { outline: 3px solid #f59e0b; outline-offset: 4px; }
          .sh-home-redesign .group { transition: transform .3s ease, box-shadow .3s ease, border-color .3s ease; }
          .sh-home-redesign .group:hover { border-color: rgb(249 115 22 / .38); }
          .sh-home-redesign img { transition: transform .65s cubic-bezier(.2,.75,.25,1), filter .35s ease; }
          .sh-home-redesign a:hover img { transform: scale(1.035); }
          .sh-home-redesign .container-page > .grid { align-items: stretch; }
          .sh-home-redesign .rounded-3xl, .sh-home-redesign .rounded-\[2rem\], .sh-home-redesign .rounded-\[1\.75rem\] { transition: box-shadow .3s ease, border-color .3s ease; }
          .sh-home-redesign .shadow-soft { box-shadow: 0 8px 30px rgb(15 23 42 / .045); }
          .sh-home-redesign .shadow-soft:hover, .sh-home-redesign .shadow-elevated:hover { box-shadow: 0 22px 60px rgb(15 23 42 / .12); }
          .sh-home-redesign .text-muted-foreground { color: var(--sh-muted); line-height: 1.8; }
          .sh-home-redesign .animate-blob { animation-duration: 14s; }
          .sh-home-redesign .sh-section-glow { position: absolute; width: 18rem; height: 18rem; border-radius: 999px; filter: blur(70px); opacity: .13; pointer-events: none; }
          @media (prefers-reduced-motion: reduce) { .sh-home-redesign *, .sh-home-redesign *::before, .sh-home-redesign *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; scroll-behavior: auto !important; } }
        `}</style>
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
      </div>
    </SiteLayout>
  );
}
