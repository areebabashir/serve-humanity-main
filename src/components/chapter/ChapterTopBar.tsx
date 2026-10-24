import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { CHAPTER_ROLE_LABEL, resolveChapterRole } from "@/lib/chapterRoles";
import { fetchInbox, fetchUnreadCount, type InboxNotification } from "@/lib/notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function ChapterTopBar({ onMenu }: { onMenu?: () => void }) {
  const { user, logout } = useAuth();
  const role = resolveChapterRole(user ?? {});
  const [bellItems, setBellItems] = useState<InboxNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshBell = useCallback(async () => {
    try {
      const [items, count] = await Promise.all([fetchInbox(), fetchUnreadCount()]);
      setBellItems(items.slice(0, 5));
      setUnreadCount(count);
    } catch {
      /* ignore bell errors */
    }
  }, []);

  useEffect(() => {
    void refreshBell();
    const id = window.setInterval(() => void refreshBell(), 60_000);
    return () => window.clearInterval(id);
  }, [refreshBell]);

  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b border-border bg-white/70 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-2">
        {onMenu ? (
          <button
            type="button"
            onClick={onMenu}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        ) : null}
        <div>
          <p className="text-sm font-semibold text-foreground">Chapter Dashboard</p>
          <p className="text-[11px] text-muted-foreground">{CHAPTER_ROLE_LABEL[role]}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu
          onOpenChange={(open) => {
            if (open) void refreshBell();
          }}
        >
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="relative grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 ? (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-orange" />
              ) : null}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 ? (
                <span className="text-xs font-normal text-muted-foreground">
                  {unreadCount} unread
                </span>
              ) : null}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {bellItems.length === 0 ? (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              bellItems.map((n) => (
                <DropdownMenuItem key={n._id} asChild className="flex-col items-start gap-0.5">
                  <Link to="/chapter/notifications">
                    <span className={`text-sm ${n.readAt ? "text-muted-foreground" : "font-medium"}`}>
                      {n.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {n.createdBy?.name ?? "Leadership"} · {relativeTime(n.createdAt)}
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/chapter/notifications" className="justify-center text-sm font-medium">
                View all
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Link
          to="/"
          className="hidden rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground sm:inline-flex"
        >
          Public site
        </Link>
        <button
          type="button"
          onClick={() =>
            void logout().then(() => {
              window.location.href = "/login";
            })
          }
          className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary/80"
        >
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </button>
      </div>
    </header>
  );
}
