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

const CEO_DASHBOARD_URL =
  import.meta.env.VITE_CEO_DASHBOARD_URL || "http://localhost:5174";

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

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname === path ||
        location.pathname.startsWith(`${path}/`);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled ? "py-2" : "py-3 sm:py-4",
      )}
    >
      <div className="container-page">
        <nav
          className={cn(
            "flex items-center justify-between gap-3 rounded-full border px-4 py-2.5 transition-all duration-500 sm:px-5",
            scrolled
              ? "glass border-border/60 shadow-soft"
              : "border-transparent bg-white/50 backdrop-blur-md",
          )}
        >
          {/* Larger logo */}
          <Link
            to="/"
            aria-label="Serve Humanity home"
            className="flex shrink-0 items-center"
          >
            <div className="flex items-center [&_img]:h-12 [&_img]:w-auto [&_img]:max-w-none [&_img]:object-contain [&_svg]:h-12 [&_svg]:w-auto sm:[&_img]:h-18 sm:[&_svg]:h-18">
              <Logo />
            </div>
          </Link>

          {/* Desktop navigation */}
          <ul className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => {
              const active = isActive(item.to);

              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative inline-flex items-center rounded-full px-3 py-2 text-[13px] font-medium transition-all duration-200 xl:px-3.5",
                      active
                        ? "text-brand-blue"
                        : "text-foreground/70 hover:bg-secondary/70 hover:text-foreground",
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

          {/* Right-side actions */}
          <div className="flex shrink-0 items-center gap-2">
            {dashboardHref &&
              (chapterUser ? (
                <Link
                  to={dashboardHref}
                  className="hidden items-center gap-1.5 rounded-full border border-brand-blue/20 bg-brand-blue/10 px-3 py-2 text-[12px] font-semibold text-brand-blue transition hover:bg-brand-blue/15 xl:inline-flex"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </Link>
              ) : (
                <a
                  href={dashboardHref}
                  className="hidden items-center gap-1.5 rounded-full border border-brand-blue/20 bg-brand-blue/10 px-3 py-2 text-[12px] font-semibold text-brand-blue transition hover:bg-brand-blue/15 xl:inline-flex"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </a>
              ))}

            {user ? (
              <button
                type="button"
                onClick={() => void logout()}
                className="hidden text-[13px] font-medium text-foreground/70 transition hover:text-foreground md:inline"
              >
                Sign out ({user.name.split(" ")[0]})
              </button>
            ) : (
              <Link
                to="/login"
                className="hidden text-[13px] font-medium text-foreground/70 transition hover:text-foreground md:inline"
              >
                Login
              </Link>
            )}

            {/* Donate button */}
            <Link
              to="/donate"
              className="group relative hidden items-center gap-1.5 overflow-hidden rounded-full bg-gradient-warm px-4 py-2.5 text-[13px] font-semibold text-white shadow-warm transition-transform hover:-translate-y-0.5 sm:inline-flex"
            >
              <Heart className="h-3.5 w-3.5 fill-white/40" />
              Donate
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </Link>

            {/* Mobile menu button */}
            <button
              type="button"
              className="rounded-full p-2 text-foreground transition hover:bg-secondary lg:hidden"
              onClick={() => setOpen((previous) => !previous)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </nav>

        {/* Mobile navigation */}
        {open && (
          <div className="mt-2 overflow-hidden rounded-3xl border border-border/60 glass p-3 shadow-elevated lg:hidden">
            <ul className="flex flex-col gap-1">
              {NAV.map((item) => {
                const active = isActive(item.to);

                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                        active
                          ? "bg-brand-orange/10 text-brand-accent"
                          : "text-foreground hover:bg-secondary",
                      )}
                    >
                      {item.label}

                      {active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" />
                      )}
                    </Link>
                  </li>
                );
              })}

              {/* Mobile dashboard link */}
              {dashboardHref && (
                <li>
                  {chapterUser ? (
                    <Link
                      to={dashboardHref}
                      className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-brand-blue transition hover:bg-brand-blue/10"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Go to dashboard
                    </Link>
                  ) : (
                    <a
                      href={dashboardHref}
                      className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-brand-blue transition hover:bg-brand-blue/10"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Go to dashboard
                    </a>
                  )}
                </li>
              )}

              {/* Mobile login/logout and donate */}
              <li className="mt-2 flex gap-2 border-t border-border pt-3">
                {user ? (
                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="flex-1 rounded-xl border border-border px-4 py-3 text-center text-sm font-semibold transition hover:bg-secondary"
                  >
                    Sign out
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="flex-1 rounded-xl border border-border px-4 py-3 text-center text-sm font-semibold transition hover:bg-secondary"
                  >
                    Login
                  </Link>
                )}

                <Link
                  to="/donate"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-warm px-4 py-3 text-center text-sm font-semibold text-white shadow-warm transition hover:-translate-y-0.5"
                >
                  <Heart className="h-4 w-4 fill-white/40" />
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