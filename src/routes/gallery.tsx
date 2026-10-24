import { Helmet } from "react-helmet-async";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { useState } from "react";
import { X } from "lucide-react";
import { highlightTitle, useWebsitePage } from "@/lib/websiteContent";

const gradients = [
  "from-brand-orange via-brand-accent to-brand-blue",
  "from-brand-blue via-brand-blue-light to-brand-orange",
  "from-brand-accent via-brand-orange to-yellow-400",
  "from-brand-blue to-brand-accent",
  "from-emerald-500 via-brand-blue to-brand-orange",
  "from-brand-orange to-brand-blue",
  "from-brand-blue-light to-brand-accent",
  "from-brand-accent to-brand-blue",
  "from-brand-orange via-pink-400 to-brand-blue",
];
const heights = [280, 360, 240, 320, 300, 380, 260, 340, 300];

type GalleryItem = { caption?: string; imageUrl?: string };
type GallerySections = {
  hero?: { eyebrow?: string; title?: string; titleHighlight?: string; description?: string };
  items?: GalleryItem[];
};

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Gallery — Serve Humanity</title>
        <meta name="description" content="Moments from the field — drives, camps and community stories in pictures." />
        <meta property="og:title" content="Gallery — Serve Humanity" />
        <meta property="og:url" content="/gallery" />
        <link rel="canonical" href="/gallery" />
      </Helmet>
      <GalleryPage />
    </>
  );
}

function GalleryPage() {
  const { sections } = useWebsitePage<GallerySections>("gallery");
  const hero = sections.hero ?? {};
  const items = sections.items ?? [];
  const [active, setActive] = useState<number | null>(null);
  const count = Math.max(items.length, 1);

  return (
    <SiteLayout>
      <PageHero
        eyebrow={hero.eyebrow || "Gallery"}
        title={highlightTitle(hero.title || "Moments from the field", hero.titleHighlight)}
        description={hero.description}
      />
      <section className="page-section">
        <div className="columns-1 gap-4 sm:columns-2 md:columns-3 [column-fill:_balance]">
          {Array.from({ length: count }).map((_, i) => {
            const item = items[i] || {};
            const g = gradients[i % gradients.length];
            const caption = item.caption || `Moment ${i + 1}`;
            const imageUrl = item.imageUrl || "";
            return (
              <Reveal key={i} delay={i % 4}>
                <button
                  onClick={() => setActive(i)}
                  className="group mb-4 block w-full overflow-hidden rounded-3xl border border-border shadow-soft transition-all hover:-translate-y-1 hover:shadow-elevated"
                  style={{ height: heights[i % heights.length] }}
                >
                  <div
                    className={`relative h-full w-full ${imageUrl ? "bg-muted" : `bg-gradient-to-br ${g}`}`}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={caption}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-mesh opacity-30" />
                    )}
                    <div className="absolute inset-0 flex items-end p-5 opacity-0 transition-opacity group-hover:opacity-100 bg-gradient-to-t from-black/60 via-black/20 to-transparent">
                      <p className="text-sm font-semibold text-white drop-shadow-md">{caption}</p>
                    </div>
                  </div>
                </button>
              </Reveal>
            );
          })}
        </div>
      </section>

      {active !== null && (
        <div
          className="fixed inset-0 z-[70] grid place-items-center bg-black/80 p-4 backdrop-blur-md animate-fade-in"
          onClick={() => setActive(null)}
        >
          <button className="absolute right-6 top-6 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
          <div
            className={`relative h-[70vh] w-full max-w-4xl overflow-hidden rounded-3xl ${
              items[active]?.imageUrl
                ? "bg-black"
                : `bg-gradient-to-br ${gradients[active % gradients.length]}`
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {items[active]?.imageUrl ? (
              <img
                src={items[active]?.imageUrl}
                alt={items[active]?.caption || ""}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="absolute inset-0 bg-mesh opacity-30" />
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-8">
              <p className="font-display text-2xl font-bold text-white">
                {items[active]?.caption || `Moment ${active + 1}`}
              </p>
            </div>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}
