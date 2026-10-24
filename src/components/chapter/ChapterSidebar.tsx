import { Link, NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  Users2,
  UserCircle,
  HeartHandshake,
  Wallet,
  Boxes,
  ClipboardCheck,
  Image as ImageIcon,
  FolderKanban,
  BarChart3,
  Settings,
  ShieldCheck,
  ChevronDown,
  ListChecks,
  HandCoins,
  UsersRound,
  FileSpreadsheet,
  Bell,
  CalendarDays,
  Headset,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  canAccessChapterModule,
  canAccessChapterModuleForUser,
  CHAPTER_ROLE_LABEL,
  chapterHomeForUser,
  isCabinetRole,
  isChapterLeadership,
  isPlainMember,
  resolveChapterRole,
} from "@/lib/chapterRoles";
import { cn } from "@/lib/utils";

type NavItem = {
  title: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  module: string;
};

const OPS_SUB = [
  { title: "Verification", to: "/chapter/verification", module: "verification" },
  { title: "Ration Cases Status File", to: "/chapter/operations", module: "operations" },
] as const;

const MEDIA_SUB = [
  { title: "Ref File", to: "/chapter/media-cases", icon: FileSpreadsheet },
  { title: "Gallery & certificates", to: "/chapter/media", icon: ImageIcon },
] as const;

const NAV: NavItem[] = [
  { title: "My donation", to: "/chapter/my-donation", icon: HandCoins, module: "my-donation" },
  { title: "Team collection", to: "/chapter/team-collection", icon: UsersRound, module: "team-collection" },
  {
    title: "Director donations",
    to: "/chapter/director-donations",
    icon: Wallet,
    module: "director-donations",
  },
  { title: "Team & Roles", to: "/chapter/team", icon: ShieldCheck, module: "team" },
  { title: "Events", to: "/chapter/events", icon: CalendarDays, module: "events" },
  { title: "Members", to: "/chapter/members", icon: Users2, module: "members" },
  { title: "Notifications", to: "/chapter/notifications", icon: Bell, module: "notifications" },
  { title: "Contact IT", to: "/chapter/contact-it", icon: Headset, module: "contact-it" },
  { title: "Finance", to: "/chapter/finance", icon: Wallet, module: "finance" },
  { title: "Documentation", to: "/chapter/documentation", icon: FolderKanban, module: "documentation" },
  {
    title: "Case registrations",
    to: "/chapter/case-registrations",
    icon: ClipboardCheck,
    module: "case-registrations",
  },
  { title: "Reports", to: "/chapter/reports", icon: BarChart3, module: "reports" },
];

function chapterName(chapter: unknown): string {
  if (!chapter) return "Chapter";
  if (typeof chapter === "string") return "Chapter";
  if (typeof chapter === "object" && chapter !== null && "name" in chapter) {
    return String((chapter as { name?: string }).name || "Chapter");
  }
  return "Chapter";
}

export function ChapterSidebar() {
  const { user } = useAuth();
  const role = resolveChapterRole(user ?? {});
  const location = useLocation();
  const leadership = isChapterLeadership(role);
  const opsActive =
    location.pathname.startsWith("/chapter/verification") ||
    location.pathname.startsWith("/chapter/operations");
  const mediaActive = location.pathname.startsWith("/chapter/media");
  const [opsOpen, setOpsOpen] = useState(opsActive);
  const [mediaOpen, setMediaOpen] = useState(mediaActive);

  const showOps =
    canAccessChapterModuleForUser(user, "ops") ||
    canAccessChapterModuleForUser(user, "verification") ||
    canAccessChapterModuleForUser(user, "operations");
  const showMedia = canAccessChapterModuleForUser(user, "media");
  const visible = NAV.filter((i) => canAccessChapterModuleForUser(user, i.module));
  const opsLinks = OPS_SUB.filter((s) => canAccessChapterModuleForUser(user, s.module));
  const plain = isPlainMember(role);
  const dashboardHome = user ? chapterHomeForUser(user) : plain ? "/chapter/my-donation" : "/chapter";

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-white/80 backdrop-blur">
      <div className="border-b border-border px-4 py-4">
        <Link to={dashboardHome} className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-warm text-white shadow-warm">
            <HeartHandshake className="h-5 w-5" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold text-foreground">Serve Humanity</p>
            <p className="truncate text-[11px] text-muted-foreground">{chapterName(user?.chapter)}</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        <div>
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Chapter
          </p>
          <NavLink
            to={dashboardHome}
            end={dashboardHome === "/chapter"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                isActive
                  ? "bg-brand-orange/10 font-semibold text-brand-orange"
                  : "text-foreground/80 hover:bg-secondary",
              )
            }
          >
            <LayoutDashboard className="h-4 w-4" />
            Go to dashboard
          </NavLink>
        </div>

        {(showOps || showMedia || visible.length > 0) && (
          <div>
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {plain ? "Donations" : "Operations"}
            </p>
            <div className="space-y-1">
              {showOps && opsLinks.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setOpsOpen((v) => !v)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                      opsActive
                        ? "bg-brand-blue/10 font-semibold text-brand-blue"
                        : "text-foreground/80 hover:bg-secondary",
                    )}
                  >
                    <Boxes className="h-4 w-4" />
                    <span className="flex-1 text-left">Ops & Verification</span>
                    <ChevronDown
                      className={cn("h-4 w-4 transition-transform", opsOpen && "rotate-180")}
                    />
                  </button>
                  {opsOpen && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-border pl-2">
                      {opsLinks.map((s) => (
                          <NavLink
                            key={s.to}
                            to={s.to}
                            className={({ isActive }) =>
                              cn(
                                "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition",
                                isActive
                                  ? "bg-brand-orange/10 font-medium text-brand-orange"
                                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                              )
                            }
                          >
                            {s.module === "verification" ? (
                              <ClipboardCheck className="h-3.5 w-3.5" />
                            ) : (
                              <ListChecks className="h-3.5 w-3.5" />
                            )}
                            {s.title}
                          </NavLink>
                        ))}
                    </div>
                  )}
                </div>
              )}
              {showMedia && (
                <div>
                  <button
                    type="button"
                    onClick={() => setMediaOpen((v) => !v)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                      mediaActive
                        ? "bg-brand-blue/10 font-semibold text-brand-blue"
                        : "text-foreground/80 hover:bg-secondary",
                    )}
                  >
                    <ImageIcon className="h-4 w-4" />
                    <span className="flex-1 text-left">Media & Graphics</span>
                    <ChevronDown
                      className={cn("h-4 w-4 transition-transform", mediaOpen && "rotate-180")}
                    />
                  </button>
                  {mediaOpen && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-border pl-2">
                      {MEDIA_SUB.map((s) => (
                        <NavLink
                          key={s.to}
                          to={s.to}
                          end={s.to === "/chapter/media"}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition",
                              isActive
                                ? "bg-brand-orange/10 font-medium text-brand-orange"
                                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                            )
                          }
                        >
                          <s.icon className="h-3.5 w-3.5" />
                          {s.title}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {visible.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                      isActive
                        ? "bg-brand-orange/10 font-semibold text-brand-orange"
                        : "text-foreground/80 hover:bg-secondary",
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.module === "director-donations" && isCabinetRole(role)
                    ? "Cabinet donations"
                    : item.module === "team-collection" && isCabinetRole(role)
                      ? "My team members"
                      : item.title}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Personal
          </p>
          <div className="space-y-1">
            <NavLink
              to="/chapter/profile"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                  isActive
                    ? "bg-brand-orange/10 font-semibold text-brand-orange"
                    : "text-foreground/80 hover:bg-secondary",
                )
              }
            >
              <UserCircle className="h-4 w-4" />
              My Profile
            </NavLink>
            {leadership && (
              <NavLink
                to="/chapter/settings"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                    isActive
                      ? "bg-brand-orange/10 font-semibold text-brand-orange"
                      : "text-foreground/80 hover:bg-secondary",
                  )
                }
              >
                <Settings className="h-4 w-4" />
                Settings
              </NavLink>
            )}
          </div>
        </div>
      </nav>

      <div className="border-t border-border px-4 py-3">
        <p className="truncate text-xs font-medium text-foreground">{user?.name}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {CHAPTER_ROLE_LABEL[role]} · {user?.email}
        </p>
      </div>
    </aside>
  );
}
