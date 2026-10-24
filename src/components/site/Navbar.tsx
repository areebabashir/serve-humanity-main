import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X, Heart, LayoutDashboard } from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { chapterHomeForUser, isChapterAppUser } from "@/lib/chapterRoles";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/team", label: "Team" },
  { to: "/chapters", label: "Chapters" },
  { to: "/events", label: "Events" },
  { to: "/gallery", label: "Gallery" },
  { to: "/contact", label: "Contact" },
] as const;

const CEO_DASHBOARD_URL = import.meta.env.VITE_CEO_DASHBOARD_URL || "http://localhost:5174";

const CEO_BOARD_ROLES = new Set([
  "ceo",
  "founder",
  "cto",
  "coo",
  "bog_verification",
  "bog_operations",
  "bog_media",
  "bog_finance",
  "bog_documentation",
  "bog_it",
]);

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const chapterUser = !!(user && isChapterAppUser(user.systemRole));
  const ceoUser = !!(user && CEO_BOARD_ROLES.has(user.systemRole));
  const dashboardHref = chapterUser
    ? chapterHomeForUser(user!)
    : ceoUser
      ? CEO_DASHBOARD_URL
      : null;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled ? "py-2" : "py-4",
      )}
    >
      <div className="container-page">
        <nav
          className={cn(
            "flex items-center justify-between rounded-full border px-4 py-2.5 transition-all duration-500",
            scrolled
              ? "glass border-border/60 shadow-soft"
              : "border-transparent bg-white/40 backdrop-blur-md",
          )}
        >
          <Logo />

          <ul className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => {
              const active = location.pathname === item.to;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      "relative rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                      active
                        ? "text-brand-blue"
                        : "text-foreground/70 hover:text-foreground",
                    )}
                  >
                    {active && (
                      <span className="absolute inset-0 -z-10 rounded-full bg-accent" />
                    )}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            {dashboardHref ? (
              chapterUser ? (
                <Link
                  to={dashboardHref}
                  className="hidden items-center gap-1.5 rounded-full border border-brand-blue/20 bg-brand-blue/10 px-3.5 py-1.5 text-[13px] font-semibold text-brand-blue transition hover:bg-brand-blue/15 md:inline-flex"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Go to dashboard
                </Link>
              ) : (
                <a
                  href={dashboardHref}
                  className="hidden items-center gap-1.5 rounded-full border border-brand-blue/20 bg-brand-blue/10 px-3.5 py-1.5 text-[13px] font-semibold text-brand-blue transition hover:bg-brand-blue/15 md:inline-flex"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Go to dashboard
                </a>
              )
            ) : null}
            {user ? (
              <button
                type="button"
                onClick={() => void logout()}
                className="hidden text-[13px] font-medium text-foreground/70 hover:text-foreground md:inline"
              >
                Sign out ({user.name.split(" ")[0]})
              </button>
            ) : (
              <Link
                to="/login"
                className="hidden text-[13px] font-medium text-foreground/70 hover:text-foreground md:inline"
              >
                Login
              </Link>
            )}
            <Link
              to="/donate"
              className="group relative hidden overflow-hidden rounded-full bg-gradient-warm px-4 py-2 text-[13px] font-semibold text-white shadow-warm transition-transform hover:-translate-y-0.5 sm:inline-flex sm:items-center sm:gap-1.5"
            >
              <Heart className="h-3.5 w-3.5 fill-white/40" />
              Donate
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </Link>
            <button
              className="lg:hidden rounded-full p-2 text-foreground hover:bg-secondary"
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        {open && (
          <div className="mt-2 rounded-3xl glass p-4 shadow-elevated lg:hidden">
            <ul className="flex flex-col gap-1">
              {NAV.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="block rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              {dashboardHref ? (
                <li>
                  {chapterUser ? (
                    <Link
                      to={dashboardHref}
                      className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-brand-blue hover:bg-brand-blue/10"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Go to dashboard
                    </Link>
                  ) : (
                    <a
                      href={dashboardHref}
                      className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-brand-blue hover:bg-brand-blue/10"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Go to dashboard
                    </a>
                  )}
                </li>
              ) : null}
              <li className="mt-2 flex gap-2 border-t border-border pt-3">
                {user ? (
                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="flex-1 rounded-xl border border-border px-4 py-2.5 text-center text-sm font-semibold"
                  >
                    Sign out
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="flex-1 rounded-xl border border-border px-4 py-2.5 text-center text-sm font-semibold"
                  >
                    Login
                  </Link>
                )}
                <Link
                  to="/donate"
                  className="flex-1 rounded-xl bg-gradient-warm px-4 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Donate
                </Link>
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
