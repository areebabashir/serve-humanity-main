import { createElement, Fragment, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";

/** Local fallbacks (same shape as backend defaults) so the site works offline / before seed. */
export const LOCAL_WEBSITE_DEFAULTS: Record<string, Record<string, unknown>> = {
  home: {
    hero: {
      eyebrow: "Humanitarian welfare · Since 2014",
      titlePrefix: "Together We",
      titleHighlight: "Build Hope",
      subtitle:
        "A world where compassion meets action. Join thousands of volunteers creating lasting change in communities that need it most.",
      primaryCta: "Donate Now",
      primaryCtaLink: "/donate",
      secondaryCta: "Need Support",
      secondaryCtaLink: "/volunteer",
    },
    stats: [
      { label: "Families Helped", value: "48,200+" },
      { label: "Volunteers", value: "12,500" },
      { label: "City Chapters", value: "36" },
      { label: "Food Packages", value: "210K" },
      { label: "Donations Raised", value: "Rs. 84M" },
    ],
    partners: {
      title: "Trusted by partners around the world",
      items: [],
    },
    donateCta: {
      eyebrow: "Make a difference today",
      title: "Your donation,",
      titleHighlight: "multiplied by love",
      body: "Every donation is tracked, verified and delivered through our chapter network.",
      cta: "Donate now",
    },
    chaptersMap: {
      eyebrow: "Global chapters",
      title: "Local roots,",
      titleHighlight: "global reach",
    },
    testimonials: {
      eyebrow: "Voices",
      title: "Stories from the",
      titleHighlight: "people we serve",
      items: [],
    },
    story: {
      eyebrow: "Our story",
      title: "A decade of turning",
      titleHighlight: "compassion into action",
      body: "Serve Humanity began as a small circle of friends who couldn't sit still while their neighbours went hungry. Today we're an organized humanitarian movement — but the heart remains unchanged: humans, showing up for humans.",
      points: [
        "Founded in 2014 with a single food drive — now a movement of thousands.",
        "Independently audited. 92¢ of every rupee reaches beneficiaries directly.",
        "Present in 36 cities with local chapters led by trusted community leaders.",
      ],
      cta: "Read our full story",
      ctaLink: "/about",
      quote: "You can't help everyone, but everyone can help someone.",
      quoteAttr: "— Our founding principle",
      estLabel: "Est. 2014",
      sideStats: [
        { value: "10+", label: "Years" },
        { value: "36", label: "Chapters" },
        { value: "48K", label: "Lives" },
      ],
    },
    principles: {
      eyebrow: "Core values",
      title: "The principles that",
      titleHighlight: "guide every act",
      subtitle: "Six commitments we make to every community, every donor, every volunteer.",
      items: [
        { title: "Compassion", desc: "We listen first. Every person we serve is met with dignity, not pity." },
        { title: "Trust", desc: "Every rupee is tracked. Every family receipt is verified." },
        { title: "Transparency", desc: "Public reports. Open books. Audited yearly, without exception." },
        { title: "Integrity", desc: "We keep promises. Our word is our foundation." },
        { title: "Empowerment", desc: "We teach skills, not just deliver aid. Sustainable change matters." },
        { title: "Unity", desc: "Faiths, backgrounds, borders — humanity is one family." },
      ],
    },
    impact: {
      eyebrow: "Measured impact",
      title: "Numbers that represent",
      titleHighlight: "real people",
      body: "Every count is a family fed, a child in school, a neighbour who felt seen.",
      stats: [
        { label: "Families Helped", end: 48200, suffix: "+" },
        { label: "Active Volunteers", end: 12500, suffix: "" },
        { label: "City Chapters", end: 36, suffix: "" },
        { label: "Food Packages", end: 210, suffix: "K" },
      ],
    },
    eightWays: {
      eyebrow: "Programs",
      title: "Eight ways we show up",
      titleHighlight: "every single day",
      items: [
        { title: "Food Security", desc: "Weekly rations, hot meals & Ramadan drives." },
        { title: "Education", desc: "Scholarships & school supplies for 8,400 children." },
        { title: "Healthcare", desc: "Free clinics, medicines & maternal care." },
        { title: "Emergency Relief", desc: "Floods, quakes, displacement — rapid response." },
        { title: "Orphan Care", desc: "Sponsorship & family support programs." },
        { title: "Women Empowerment", desc: "Skills training & micro-grants for women." },
        { title: "Clean Water", desc: "Wells, filters & rural infrastructure." },
        { title: "Skills Development", desc: "Free vocational training & job placement." },
      ],
    },
  },
  about: {
    hero: {
      eyebrow: "About us",
      title: "Ten years of showing up",
      titleHighlight: "showing up",
      description:
        "Serve Humanity started as a single food drive in 2014. Today we're a global movement of volunteers, donors and community leaders.",
    },
    story: {
      title: "Our story",
      paragraphs: [
        "What began with a handful of friends distributing meals in one neighbourhood has become a coordinated humanitarian effort across 36 cities. Along the way, our principles haven't changed: dignity for every person, transparency in every rupee, and community-led action in every chapter.",
        "We measure success not in dollars raised but in lives sustainably changed — children back in school, families back on their feet, women earning their first income, elders no longer forgotten.",
      ],
      cta: "Meet our team",
      ctaLink: "/team",
    },
    values: [
      { title: "Compassion", body: "48K+ families" },
      { title: "Trust", body: "92¢ per rupee" },
      { title: "Transparency", body: "Audited yearly" },
      { title: "Integrity", body: "10 years, unbroken" },
      { title: "Empowerment", body: "8K+ students" },
      { title: "Unity", body: "36 chapters" },
    ],
    founder: {
      eyebrow: "Founder's message",
      name: "Muhammad Zeeshan",
      role: "Founder",
      message:
        "Serve Humanity began with a simple belief — that no neighbour should go hungry while we have the means to help. That belief still guides every meal we serve and every hand we hold.",
      imageUrl: "",
    },
    ceo: {
      eyebrow: "CEO's message",
      name: "Muhammad Zeeshan",
      role: "Founder & CEO",
      message:
        "Transparency, dignity and local leadership are not slogans for us — they are how we work. Together with our chapters, we turn compassion into lasting change.",
      imageUrl: "",
    },
    programs: {
      eyebrow: "Programs",
      title: "Every program tells a story",
      titleHighlight: "tells a story",
      description:
        "Eight coordinated programs designed to address the root causes of hardship — not just the symptoms.",
      items: [
        { title: "Food Security", body: "Weekly rations, hot meals, Ramadan drives and food banks in every chapter city.", stat: "210K packages" },
        { title: "Education", body: "Scholarships, uniforms, books and mentoring for children who'd otherwise drop out.", stat: "8,400 students" },
        { title: "Healthcare", body: "Free clinics, medicines, maternal care and specialist camps in underserved areas.", stat: "62 clinics" },
        { title: "Emergency Relief", body: "Rapid response for floods, earthquakes and displacement crises within 48 hours.", stat: "12 crises served" },
        { title: "Orphan Care", body: "Sponsorship programs providing food, education and dignity to orphaned children.", stat: "1,240 children" },
        { title: "Women Empowerment", body: "Skills training, micro-grants and safe spaces for women to build livelihoods.", stat: "2,800 women" },
        { title: "Clean Water", body: "Wells, filtration systems and rural water infrastructure that lasts decades.", stat: "148 wells" },
        { title: "Skills Development", body: "Vocational training in tailoring, IT, culinary arts and trades with job placement.", stat: "4,600 graduates" },
      ],
    },
  },
  mission: {
    hero: {
      eyebrow: "Mission & Vision",
      title: "Why we exist",
      titleHighlight: "exist",
      description:
        "A clear north star for every act of service — from a single meal to a global response.",
    },
    mission: {
      title: "Our Mission",
      body: "To restore dignity and hope to communities in need — through transparent, sustained humanitarian action that empowers people to rebuild their own lives.",
    },
    vision: {
      title: "Our Vision",
      body: "A world where no child sleeps hungry, no family faces crisis alone, and every community has the resources it needs to thrive.",
    },
  },
  leadership: {
    hero: {
      eyebrow: "Team",
      title: "Team",
      titleHighlight: "",
      description:
        "A dedicated team of volunteers, board members and chapter leaders — united by one purpose.",
    },
    // No dummy roster — Team page is filled only from CMS / DB
    groups: [],
  },
  chapters: {
    hero: {
      eyebrow: "City chapters",
      title: "Local roots, global reach",
      titleHighlight: "global reach",
      description:
        "Local chapters delivering humanitarian work — each led by a president and driven by community volunteers.",
    },
    // Chapter cards come from the Chapters collection — not CMS dummy list
    items: [],
  },
  programs: {
    hero: {
      eyebrow: "Programs",
      title: "Every program tells a story",
      titleHighlight: "tells a story",
      description:
        "Eight coordinated programs designed to address the root causes of hardship — not just the symptoms.",
    },
    items: [
      { title: "Food Security", body: "Weekly rations, hot meals, Ramadan drives and food banks in every chapter city.", stat: "210K packages" },
      { title: "Education", body: "Scholarships, uniforms, books and mentoring for children who'd otherwise drop out.", stat: "8,400 students" },
      { title: "Healthcare", body: "Free clinics, medicines, maternal care and specialist camps in underserved areas.", stat: "62 clinics" },
      { title: "Emergency Relief", body: "Rapid response for floods, earthquakes and displacement crises within 48 hours.", stat: "12 crises served" },
      { title: "Orphan Care", body: "Sponsorship programs providing food, education and dignity to orphaned children.", stat: "1,240 children" },
      { title: "Women Empowerment", body: "Skills training, micro-grants and safe spaces for women to build livelihoods.", stat: "2,800 women" },
      { title: "Clean Water", body: "Wells, filtration systems and rural water infrastructure that lasts decades.", stat: "148 wells" },
      { title: "Skills Development", body: "Vocational training in tailoring, IT, culinary arts and trades with job placement.", stat: "4,600 graduates" },
    ],
  },
  events: {
    hero: {
      eyebrow: "Events",
      title: "Show up. Change lives.",
      titleHighlight: "Change lives.",
      description:
        "Join drives, camps and community events — every one is an opportunity to give more than a donation.",
    },
    items: [
      { title: "Ramadan Iftar Drive", date: "Mar 12, 2026", location: "Karachi", days: 42, capacity: "3,000 meals" },
      { title: "Winter Warmth Distribution", date: "Dec 20, 2025", location: "Peshawar", days: 8, capacity: "1,200 blankets" },
      { title: "Free Medical Camp", date: "Nov 05, 2025", location: "Lahore", days: 3, capacity: "600 patients" },
      { title: "Back-to-School Supplies", date: "Aug 15, 2026", location: "Islamabad", days: 210, capacity: "1,800 kits" },
      { title: "Clean Water Groundbreak", date: "Oct 01, 2025", location: "Tharparkar", days: 0, capacity: "8 villages" },
      { title: "Women Skills Fair", date: "Feb 22, 2026", location: "Dubai", days: 130, capacity: "400 attendees" },
    ],
  },
  gallery: {
    hero: {
      eyebrow: "Gallery",
      title: "Moments from the field",
      titleHighlight: "the field",
      description: "Every picture is a story of someone showing up for someone else.",
    },
    items: [
      { caption: "Ramadan Iftar 2024 — Karachi", imageUrl: "" },
      { caption: "Medical Camp — Lahore", imageUrl: "" },
      { caption: "Winter Drive — Peshawar", imageUrl: "" },
      { caption: "Orphan Sponsorship Ceremony", imageUrl: "" },
      { caption: "Clean Water Well Inauguration", imageUrl: "" },
      { caption: "Women Skills Graduation", imageUrl: "" },
      { caption: "Emergency Flood Relief 2023", imageUrl: "" },
      { caption: "Back-to-School Distribution", imageUrl: "" },
      { caption: "Volunteer Training — Dubai", imageUrl: "" },
    ],
  },
  faq: {
    hero: {
      eyebrow: "FAQ",
      title: "Common questions",
      titleHighlight: "questions",
      description:
        "Everything you might want to ask before you donate, volunteer or partner with us.",
    },
    items: [
      {
        q: "How much of my donation goes to families?",
        a: "92% of every rupee is delivered directly through programs. The remaining 8% covers operations, audit and compliance.",
      },
      {
        q: "Is my donation tax-deductible?",
        a: "Yes — Serve Humanity is a registered welfare organization. You'll receive a tax-deductible receipt by email immediately.",
      },
      {
        q: "Can I choose which cause I'm funding?",
        a: "Absolutely. On the Donate page you can direct your gift to Food, Education, Healthcare, Orphans, Water or leave it General.",
      },
      {
        q: "How are beneficiaries verified?",
        a: "Every applicant is visited by a local volunteer, documentation is captured, and requests are approved by a chapter committee within 48 hours.",
      },
      {
        q: "Can I volunteer if I only have a few hours a month?",
        a: "Yes — flexible schedules are normal. Fill the volunteer form and we'll match you to opportunities that fit.",
      },
      {
        q: "How do I start a chapter in my city?",
        a: "Contact us via the Contact page with your city and a short introduction. Chapter Development will guide you through the process.",
      },
      {
        q: "Are financials public?",
        a: "Yes. Audited financial statements are published annually and available on request.",
      },
    ],
  },
  contact: {
    hero: {
      eyebrow: "Contact",
      title: "Let's talk",
      titleHighlight: "talk",
      description:
        "Questions, partnerships, media enquiries — we usually reply within one business day.",
    },
    details: [
      { label: "Email", value: "hello@servehumanity.org" },
      { label: "Phone", value: "+92 300 000 0000" },
      { label: "Head office", value: "Karachi, Pakistan" },
      { label: "Hours", value: "Mon – Sat · 9:00 – 18:00" },
    ],
  },
  donate: {
    hero: {
      eyebrow: "Donate",
      title: "Your gift, multiplied",
      titleHighlight: "multiplied",
      description:
        "Support Serve Humanity with a bank transfer — every rupee is tracked and delivered through our chapter network.",
    },
    cta: "Donate now",
    causes: ["General", "Food", "Education", "Healthcare", "Orphans", "Water"],
    note: "",
    bankAccount: {
      bankName: "Serve Humanity Official Account",
      accountTitle: "Serve Humanity",
      accountNumber: "0000-0000000000",
      iban: "",
      note: "Transfer your donation to this account, then share the receipt with your chapter or hello@servehumanity.org.",
    },
  },
  volunteer: {
    hero: {
      eyebrow: "Need support",
      title: "Request help for a deserving family",
      titleHighlight: "deserving family",
      description:
        "If you or a family needs support, fill this form. Choose a chapter — it goes to that chapter’s president, vice president, and documentation cabinet.",
    },
    perks: [
      { title: "Real Community", body: "Meet the most kind-hearted people you'll ever know." },
      { title: "Real Impact", body: "See families you helped return, thriving." },
      { title: "Real Growth", body: "Leadership, project management, communication — skills for life." },
    ],
  },
  footer: {
    tagline:
      "A humanitarian welfare organization uniting volunteers and donors to deliver compassion, dignity and lasting change to communities everywhere.",
    newsletterTitle: "Stay part of the mission",
    newsletterBody:
      "Monthly stories from the field, upcoming events and how your support is shaping lives. No spam — ever.",
    copyright: "Serve Humanity. All rights reserved.",
    social: {
      facebook: "#",
      instagram: "#",
      twitter: "#",
      youtube: "#",
      whatsapp: "",
    },
  },
};

export type WebsitePageKey = keyof typeof LOCAL_WEBSITE_DEFAULTS;

export function highlightTitle(title: string, highlight?: string): ReactNode {
  if (!highlight || !title.includes(highlight)) return title;
  const i = title.indexOf(highlight);
  const before = title.slice(0, i);
  const after = title.slice(i + highlight.length);
  return createElement(
    Fragment,
    null,
    before,
    createElement("span", { className: "text-gradient-brand" }, highlight),
    after,
  );
}

function mergeSections(
  fallback: Record<string, unknown>,
  remote?: Record<string, unknown> | null,
): Record<string, unknown> {
  if (!remote || typeof remote !== "object") return fallback;
  const merged = { ...fallback, ...remote };
  // Keep nested social keys (e.g. whatsapp) when DB footer was saved before that field existed
  const fbSocial = fallback.social;
  const remSocial = remote.social;
  if (
    fbSocial &&
    typeof fbSocial === "object" &&
    !Array.isArray(fbSocial) &&
    remSocial &&
    typeof remSocial === "object" &&
    !Array.isArray(remSocial)
  ) {
    merged.social = { ...(fbSocial as object), ...(remSocial as object) };
  }
  return merged;
}

const OFFLINE_CACHE_PREFIX = "sh_offline_cache:";

/** Last successful DB snapshot — used when API / internet is unavailable. */
export function readOfflineCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${OFFLINE_CACHE_PREFIX}${key}`);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeOfflineCache(key: string, data: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${OFFLINE_CACHE_PREFIX}${key}`, JSON.stringify(data));
  } catch {
    /* quota / private mode — ignore */
  }
}

/** Fetch one published page. Set `dbOnly` to skip local dummy defaults (use CMS/DB only). */
export function useWebsitePage<T extends Record<string, unknown> = Record<string, unknown>>(
  page: WebsitePageKey,
  options?: { dbOnly?: boolean },
) {
  const dbOnly = options?.dbOnly === true;
  const codeDefaults = (dbOnly ? {} : LOCAL_WEBSITE_DEFAULTS[page] || {}) as T;
  const cacheKey = `website:${page}`;

  const [sections, setSections] = useState<T>(() => {
    const cached = readOfflineCache<Record<string, unknown>>(cacheKey);
    if (cached && typeof cached === "object") {
      return (dbOnly ? cached : mergeSections(codeDefaults as Record<string, unknown>, cached)) as T;
    }
    return codeDefaults;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api<{ success: true; data: { sections?: Record<string, unknown> } }>(
      `/website/public?page=${encodeURIComponent(page)}`,
    )
      .then((res) => {
        if (cancelled) return;
        const remote = (res.data?.sections ?? {}) as Record<string, unknown>;
        // Persist DB snapshot as offline/dummy data for next visit
        writeOfflineCache(cacheKey, remote);
        setSections(
          (dbOnly ? remote : mergeSections(codeDefaults as Record<string, unknown>, remote)) as T,
        );
      })
      .catch(() => {
        if (cancelled) return;
        const cached = readOfflineCache<Record<string, unknown>>(cacheKey);
        if (cached && typeof cached === "object") {
          setSections(
            (dbOnly ? cached : mergeSections(codeDefaults as Record<string, unknown>, cached)) as T,
          );
        } else {
          setSections(codeDefaults);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, dbOnly]);

  return { sections, loading };
}

