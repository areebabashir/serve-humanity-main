import type { ReactNode } from "react";

export function ChapterPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {title}
        </h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function ChapterCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-4 shadow-soft md:p-5 ${className}`}>
      {children}
    </div>
  );
}

export function ComingSoonModule({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div>
      <ChapterPageHeader title={title} description={blurb} />
      <ChapterCard>
        <p className="text-sm text-muted-foreground">
          This module is ready in the chapter shell. Full chapter workflows will expand here next —
          your role already controls who can open this page.
        </p>
      </ChapterCard>
    </div>
  );
}
