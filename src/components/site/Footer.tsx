import { Link } from "react-router-dom";
import { useState, type FormEvent, type SVGProps } from "react";
import { Facebook, Instagram, Twitter, Mail, ArrowUpRight, Heart, Loader2 } from "lucide-react";
import { Logo } from "./Logo";
import { useWebsitePage } from "@/lib/websiteContent";
import { api, ApiRequestError } from "@/lib/api";

const cols = [
  {
    title: "Organization",
    links: [
      { label: "About Us", to: "/about" },
      { label: "Mission & Vision", to: "/mission" },
      { label: "Team", to: "/team" },
      { label: "City Chapters", to: "/chapters" },
    ],
  },
  {
    title: "Get Involved",
    links: [
      { label: "Donate", to: "/donate" },
      { label: "Need Support", to: "/volunteer" },
      { label: "Events", to: "/events" },
      { label: "Gallery", to: "/gallery" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Programs", to: "/about#programs" },
      { label: "FAQ", to: "/faq" },
      { label: "Contact", to: "/contact" },
      { label: "Login", to: "/login" },
    ],
  },
] as const;

function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

type SocialKey = "facebook" | "instagram" | "twitter" | "youtube" | "whatsapp";

const SOCIAL: {
  key: SocialKey;
  label: string;
  Icon: typeof Facebook | typeof WhatsAppIcon;
}[] = [
  { Icon: Facebook, key: "facebook", label: "Facebook" },
  { Icon: Instagram, key: "instagram", label: "Instagram" },
  { Icon: Twitter, key: "twitter", label: "Twitter" },
  { Icon: WhatsAppIcon, key: "whatsapp", label: "WhatsApp" },
];

function socialHref(raw?: string) {
  const v = (raw || "").trim();
  if (!v || v === "#") return null;
  return v;
}

type FooterSections = {
  tagline?: string;
  newsletterTitle?: string;
  newsletterBody?: string;
  copyright?: string;
  social?: Partial<Record<SocialKey, string>>;
};

export function Footer() {
  const { sections } = useWebsitePage<FooterSections>("footer");
  const social = sections.social ?? {};
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function onSubscribe(e: FormEvent) {
    e.preventDefault();
    setMsg("");
    setErr("");
    const value = email.trim().toLowerCase();
    if (!value) {
      setErr("Enter your email address.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api<{ success: true; message?: string }>("/newsletter/subscribe", {
        method: "POST",
        body: JSON.stringify({ email: value, source: "footer" }),
      });
      setMsg(res.message || "Subscribed. Thank you!");
      setEmail("");
    } catch (error) {
      setErr(error instanceof ApiRequestError ? error.message : "Subscribe failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const visibleSocial = SOCIAL.map((item) => ({
    ...item,
    href: socialHref(social[item.key]),
  }));

  return (
    <footer className="relative mt-24 overflow-hidden bg-gradient-cool text-white">
      <svg
        className="absolute inset-x-0 top-0 -translate-y-px w-full text-background"
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          fill="currentColor"
          d="M0,32L60,42.7C120,53,240,75,360,74.7C480,75,600,53,720,42.7C840,32,960,32,1080,37.3C1200,43,1320,53,1380,58.7L1440,64L1440,0L0,0Z"
        />
      </svg>

      <div className="pointer-events-none absolute -left-32 top-40 h-96 w-96 rounded-full bg-brand-orange/20 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-brand-accent/20 blur-3xl animate-blob" />

      <div className="container-page relative pt-32 pb-10">
        <div className="mb-16 grid gap-8 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md md:grid-cols-[1.2fr_1fr] md:items-center md:p-10">
          <div>
            <h3 className="font-display text-2xl font-bold md:text-3xl">
              {sections.newsletterTitle || "Stay part of the mission"}
            </h3>
            <p className="mt-2 max-w-md text-sm text-white/70">
              {sections.newsletterBody ||
                "Monthly stories from the field, upcoming events and how your support is shaping lives. No spam — ever."}
            </p>
          </div>
          <div>
            <form onSubmit={onSubscribe} className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  placeholder="you@example.com"
                  disabled={submitting}
                  className="w-full rounded-full border border-white/10 bg-white/10 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/50 outline-none transition focus:border-brand-orange focus:bg-white/15 disabled:opacity-70"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="group inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-warm px-5 py-3 text-sm font-semibold shadow-warm transition hover:-translate-y-0.5 disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    Subscribe
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-45" />
                  </>
                )}
              </button>
            </form>
            {msg ? <p className="mt-2 text-xs text-emerald-300">{msg}</p> : null}
            {err ? <p className="mt-2 text-xs text-red-300">{err}</p> : null}
          </div>
        </div>

        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="[&_span]:!text-white [&_.text-muted-foreground]:!text-white/60 [&_.text-foreground]:!text-white">
              <Logo />
            </div>
            <p className="mt-5 max-w-sm text-sm text-white/70">
              {sections.tagline ||
                "A humanitarian welfare organization uniting volunteers and donors to deliver compassion, dignity and lasting change to communities everywhere."}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {visibleSocial.map(({ Icon, key, label, href }) => (
                <a
                  key={key}
                  href={href || "#"}
                  target={href ? "_blank" : undefined}
                  rel={href ? "noopener noreferrer" : undefined}
                  aria-label={label}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:-translate-y-0.5 hover:border-brand-orange hover:bg-brand-orange hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/90">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-sm text-white/70 transition hover:text-brand-orange">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/60 md:flex-row md:items-center">
          <p>
            © {new Date().getFullYear()} {sections.copyright || "Serve Humanity. All rights reserved."}
          </p>
      
        </div>
      </div>
    </footer>
  );
}
