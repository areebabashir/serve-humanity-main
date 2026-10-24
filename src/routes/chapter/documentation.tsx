import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { DocumentationTypePage } from "@/components/documentation/DocumentationTypePage";
import { DocumentationCasesBoard } from "@/components/documentation/DocumentationCasesBoard";
import { ChapterCard } from "@/components/chapter/ChapterPage";
import type { ChapterScope } from "@/components/finance/FinanceDonationPage";
import { cn } from "@/lib/utils";
import { DOC_NAV, type DocType } from "@/lib/documentation";
import { chapterIdFromUser } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const DOC_TYPES = DOC_NAV.filter((item): item is typeof item & { type: DocType } => item.type !== "hub" && item.type !== "cases");

function chapterScopeFromUser(user: ReturnType<typeof useAuth>["user"]): ChapterScope | null {
  const chapterId = chapterIdFromUser(user);
  if (!chapterId) return null;
  const chapterName =
    user?.chapter && typeof user.chapter === "object" && user.chapter.name
      ? user.chapter.name
      : "Chapter";
  return { chapterId, chapterName };
}

function isDocType(value: string | null): value is DocType {
  return DOC_TYPES.some((item) => item.type === value);
}

export default function ChapterDocumentationPage() {
  const { user } = useAuth();
  const scope = chapterScopeFromUser(user);
  const [searchParams, setSearchParams] = useSearchParams();

  const viewCases = searchParams.get("view") === "cases" || !searchParams.get("type");

  const selectedType = useMemo(() => {
    const fromQuery = searchParams.get("type");
    return isDocType(fromQuery) ? fromQuery : "health";
  }, [searchParams]);

  const activeNav = DOC_TYPES.find((item) => item.type === selectedType) ?? DOC_TYPES[0];

  if (!scope) {
    return (
      <ChapterCard>
        <p className="text-sm text-muted-foreground">
          Your account is not linked to a chapter. Contact an administrator to assign your chapter
          before using documentation.
        </p>
      </ChapterCard>
    );
  }

  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.delete("type");
              next.set("view", "cases");
              return next;
            })
          }
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition",
            viewCases
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:text-foreground",
          )}
        >
          All Cases
        </button>
        {DOC_TYPES.map((item) => (
          <button
            key={item.type}
            type="button"
            onClick={() =>
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.delete("view");
                next.set("type", item.type);
                return next;
              })
            }
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              !viewCases && selectedType === item.type
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {item.title}
          </button>
        ))}
      </nav>

      {viewCases ? (
        <DocumentationCasesBoard />
      ) : (
        <DocumentationTypePage
          type={activeNav.type}
          description={activeNav.description}
          scope={scope}
        />
      )}
    </div>
  );
}
