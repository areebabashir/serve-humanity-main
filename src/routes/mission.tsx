import { Helmet } from "react-helmet-async";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Target, Eye } from "lucide-react";
import { highlightTitle, useWebsitePage } from "@/lib/websiteContent";

type MissionSections = {
  hero?: { eyebrow?: string; title?: string; titleHighlight?: string; description?: string };
  mission?: { title?: string; body?: string };
  vision?: { title?: string; body?: string };
};

export default function Page() {
  const { sections } = useWebsitePage<MissionSections>("mission");
  const hero = sections.hero ?? {};
  const cards = [
    {
      icon: Target,
      title: sections.mission?.title || "Our Mission",
      body: sections.mission?.body || "",
      cls: "bg-gradient-warm text-white shadow-warm",
    },
    {
      icon: Eye,
      title: sections.vision?.title || "Our Vision",
      body: sections.vision?.body || "",
      cls: "bg-gradient-cool text-white shadow-cool",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Mission & Vision — Serve Humanity</title>
        <meta name="description" content="Our mission to serve humanity and our vision for a compassionate world." />
        <meta property="og:title" content="Mission & Vision — Serve Humanity" />
        <meta property="og:url" content="/mission" />
        <link rel="canonical" href="/mission" />
      </Helmet>
      <SiteLayout>
        <PageHero
          eyebrow={hero.eyebrow || "Mission & Vision"}
          title={highlightTitle(hero.title || "Why we exist", hero.titleHighlight)}
          description={hero.description}
        />
        <section className="page-section grid gap-6 md:grid-cols-2">
          {cards.map((c, i) => (
            <Reveal key={c.title} delay={i} className={`relative overflow-hidden rounded-3xl p-8 md:p-10 ${c.cls}`}>
              <div className="absolute inset-0 bg-mesh opacity-30" />
              <div className="relative">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                  <c.icon className="h-6 w-6" />
                </div>
                <h2 className="mt-5 font-display text-3xl font-bold">{c.title}</h2>
                <p className="mt-3 text-white/90 leading-relaxed">{c.body}</p>
              </div>
            </Reveal>
          ))}
        </section>
      </SiteLayout>
    </>
  );
}
