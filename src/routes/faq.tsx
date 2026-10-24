import { Helmet } from "react-helmet-async";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { highlightTitle, useWebsitePage } from "@/lib/websiteContent";

type FaqSections = {
  hero?: { eyebrow?: string; title?: string; titleHighlight?: string; description?: string };
  items?: { q: string; a: string }[];
};

export default function Page() {
  const { sections } = useWebsitePage<FaqSections>("faq");
  const hero = sections.hero ?? {};
  const faqs = sections.items ?? [];

  return (
    <>
      <Helmet>
        <title>FAQ — Serve Humanity</title>
        <meta name="description" content="Answers to the most common questions about donations, volunteering and our work." />
        <meta property="og:title" content="FAQ — Serve Humanity" />
        <meta property="og:url" content="/faq" />
        <link rel="canonical" href="/faq" />
      </Helmet>
      <SiteLayout>
        <PageHero
          eyebrow={hero.eyebrow || "FAQ"}
          title={highlightTitle(hero.title || "Common questions", hero.titleHighlight)}
          description={hero.description}
        />
        <section className="page-section max-w-3xl mx-auto">
          <Reveal>
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`i${i}`} className="rounded-2xl border border-border bg-card px-5 shadow-soft">
                  <AccordionTrigger className="text-left font-display text-base font-semibold hover:no-underline">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </section>
      </SiteLayout>
    </>
  );
}
