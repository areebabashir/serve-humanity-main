import { useCallback, useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ChapterCard, ChapterPageHeader } from "@/components/chapter/ChapterPage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApiRequestError } from "@/lib/api";
import {
  dismissNotification,
  fetchInbox,
  markNotificationRead,
  type InboxNotification,
  type NotificationPriority,
} from "@/lib/notifications";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function priorityVariant(p: NotificationPriority): "secondary" | "default" | "destructive" {
  if (p === "urgent") return "destructive";
  if (p === "high") return "default";
  return "secondary";
}

export default function ChapterNotificationsPage() {
  const [inbox, setInbox] = useState<InboxNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setInbox(await fetchInbox());
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleMarkRead(id: string) {
    try {
      await markNotificationRead(id);
      setInbox((prev) =>
        prev.map((n) => (n._id === id ? { ...n, readAt: new Date().toISOString() } : n)),
      );
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to mark as read");
    }
  }

  async function handleDismiss(id: string) {
    try {
      await dismissNotification(id);
      setInbox((prev) => prev.filter((n) => n._id !== id));
      toast.success("Removed from your notifications");
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to delete");
    }
  }

  return (
    <div>
      <ChapterPageHeader
        title="Notifications"
        description="Messages sent to you. Delete removes a notification from your inbox only — other people still see it."
      />
      <ChapterCard>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : inbox.length === 0 ? (
          <p className="text-sm text-muted-foreground">Your inbox is empty.</p>
        ) : (
          <div className="space-y-3">
            {inbox.map((n) => {
              const unread = !n.readAt;
              return (
                <article
                  key={n._id}
                  className={`rounded-xl border p-4 ${
                    unread ? "border-brand-orange/40 bg-secondary/40" : "border-border bg-card"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`font-semibold ${unread ? "" : "text-muted-foreground"}`}>
                          {n.title}
                        </h3>
                        {unread ? (
                          <Badge variant="secondary" className="text-[10px]">
                            Unread
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm">{n.body}</p>
                    </div>
                    <Badge variant={priorityVariant(n.priority)}>{n.priority}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      {n.createdBy?.name ?? "Leadership"} · {formatWhen(n.createdAt)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {unread ? (
                        <Button size="sm" variant="outline" onClick={() => void handleMarkRead(n._id)}>
                          Mark as read
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => void handleDismiss(n._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </ChapterCard>
    </div>
  );
}
