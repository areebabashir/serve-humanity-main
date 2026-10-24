import { motion } from "motion/react";
import type { ReactNode } from "react";

/** Shared page header used across all main website pages (except home). */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <>
      <section className="relative overflow-hidden pt-32 pb-10 md:pt-40 md:pb-12">
        <div className="pointer-events-none absolute inset-0 bg-mesh opacity-70" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-orange/[0.06] via-transparent to-transparent" />
        <div className="pointer-events-none absolute -left-24 top-28 h-72 w-72 rounded-full bg-brand-orange/25 blur-3xl animate-blob" />
        <div className="pointer-events-none absolute right-0 top-52 h-80 w-80 rounded-full bg-brand-blue/20 blur-3xl animate-blob" />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-[45%] opacity-25"
          style={{
            backgroundImage:
              "repeating-radial-gradient(circle at 110% 40%, transparent 0, transparent 32px, rgba(248,156,27,0.12) 33px, transparent 34px)",
          }}
        />

        <div className="container-page relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-orange/30 bg-white/80 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-accent shadow-soft backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-orange animate-pulse" />
              {eyebrow}
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground md:text-6xl">
              {title}
            </h1>
            {description && (
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                {description}
              </p>
            )}
            {children && <div className="mt-8">{children}</div>}
          </motion.div>
        </div>
      </section>

      {/* Gap between hero and page content — outside hero so it’s real empty space */}
      <div className="h-16 md:h-24 lg:h-28" aria-hidden />
    </>
  );
}
