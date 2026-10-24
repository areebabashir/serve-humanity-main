import { Link } from "react-router-dom";
import {
  ArrowRight,
  ClipboardCheck,
  FileSpreadsheet,
  FolderKanban,
  HandCoins,
  Image as ImageIcon,
  ListChecks,
  ShieldCheck,
  Users2,
  UsersRound,
  Wallet,
  CalendarDays,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  canAccessChapterModule,
  CHAPTER_ROLE_LABEL,
  isCabinetRole,
  resolveChapterRole,
} from "@/lib/chapterRoles";
import { ChapterCard, ChapterPageHeader } from "@/components/chapter/ChapterPage";

function chapterLabel(chapter: unknown): string {
  if (!chapter) return "your chapter";
  if (typeof chapter === "object" && chapter !== null && "name" in chapter) {
    return String((chapter as { name?: string }).name || "your chapter");
  }
  return "your chapter";
}

const SHORTCUTS = [
  {
    module: "my-donation",
    to: "/chapter/my-donation",
    title: "My collection",
    blurb: "Your personal donations",
    icon: HandCoins,
  },
  {
    module: "team-collection",
    to: "/chapter/team-collection",
    title: "Team collection",
    blurb: "Your director team donations",
    icon: UsersRound,
  },
  {
    module: "director-donations",
    to: "/chapter/director-donations",
    title: "Director donations",
    blurb: "All teams + verify (Finance)",
    icon: HandCoins,
  },
  {
    module: "verification",
    to: "/chapter/verification",
    title: "Verification",
    blurb: "Team verification sheet",
    icon: ClipboardCheck,
  },
  {
    module: "operations",
    to: "/chapter/operations",
    title: "Ration Cases Status File",
    blurb: "Case Number, Family Guardian, City, Rashan Status",
    icon: ListChecks,
  },
  {
    module: "media",
    to: "/chapter/media-cases",
    title: "Ref File",
    blurb: "Media & Graphics reference file",
    icon: FileSpreadsheet,
  },
  {
    module: "finance",
    to: "/chapter/finance",
    title: "Finance files",
    blurb: "Monthly donations & cases",
    icon: Wallet,
  },
  {
    module: "media",
    to: "/chapter/media",
    title: "Media & Graphics",
    blurb: "Gallery, templates, certificates",
    icon: ImageIcon,
  },
  {
    module: "documentation",
    to: "/chapter/documentation",
    title: "Documentation",
    blurb: "Case documentation files",
    icon: FolderKanban,
  },
  {
    module: "team",
    to: "/chapter/team",
    title: "Team & Roles",
    blurb: "Assign directors and teams",
    icon: ShieldCheck,
  },
  {
    module: "events",
    to: "/chapter/events",
    title: "Events",
    blurb: "Post events to the public website",
    icon: CalendarDays,
  },
  {
    module: "reports",
    to: "/chapter/reports",
    title: "Reports",
    blurb: "Live chapter summary & PDF export",
    icon: BarChart3,
  },
  {
    module: "members",
    to: "/chapter/members",
    title: "Members",
    blurb: "Chapter member directory",
    icon: Users2,
  },
] as const;

export default function ChapterOverviewPage() {
  const { user } = useAuth();
  const role = resolveChapterRole(user ?? {});
  const first = user?.name?.split(" ")[0] || "there";
  const cabinet = isCabinetRole(role);
  const links = SHORTCUTS.filter((s) => canAccessChapterModule(role, s.module));

  return (
    <div>
      <ChapterPageHeader
        title={`Welcome back, ${first}`}
        description={`${CHAPTER_ROLE_LABEL[role]} · ${chapterLabel(user?.chapter)}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((item) => {
          const title =
            cabinet && item.module === "team-collection"
              ? "My team members"
              : cabinet && item.module === "director-donations"
                ? "Cabinet donations"
                : item.title;
          const blurb =
            cabinet && item.module === "team-collection"
              ? "Members linked to your cabinet"
              : cabinet && item.module === "director-donations"
                ? "Your directors, members & donations"
                : item.blurb;
          return (
          <Link
            key={item.to}
            to={item.to}
            className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-orange/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-orange/10 text-brand-orange">
                <item.icon className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-brand-orange" />
            </div>
            <h2 className="mt-4 font-display text-lg font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>
          </Link>
          );
        })}
      </div>

      {links.length === 0 ? (
        <ChapterCard className="mt-4">
          <p className="text-sm text-muted-foreground">
            No modules are available for your role yet. Ask a director to assign access.
          </p>
        </ChapterCard>
      ) : null}
    </div>
  );
}
