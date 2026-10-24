import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, MessageSquarePlus, Send } from "lucide-react";
import { toast } from "sonner";
import { ChapterCard, ChapterPageHeader } from "@/components/chapter/ChapterPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { ApiRequestError } from "@/lib/api";
import {
  createItThread,
  fetchItThread,
  fetchMyItThreads,
  replyItThread,
  senderName,
  setItThreadStatus,
  type ItSupportThread,
} from "@/lib/itSupport";
import { cn } from "@/lib/utils";

function formatWhen(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function ChapterContactItPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ItSupportThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [active, setActive] = useState<ItSupportThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [creating, setCreating] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchMyItThreads();
      setThreads(rows);
      if (!activeId && rows[0]) setActiveId(rows[0]._id);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, [activeId]);

  useEffect(() => {
    void loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeId) {
      setActive(null);
      return;
    }
    let cancelled = false;
    setLoadingThread(true);
    void fetchItThread(activeId)
      .then((t) => {
        if (!cancelled) {
          setActive(t);
          setThreads((prev) =>
            prev.map((row) => (row._id === t._id ? { ...row, unread: false, ...t } : row)),
          );
        }
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err instanceof ApiRequestError ? err.message : "Failed to open conversation");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingThread(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  const unreadCount = useMemo(() => threads.filter((t) => t.unread).length, [threads]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and message are required");
      return;
    }
    setCreating(true);
    try {
      const created = await createItThread({ subject: subject.trim(), body: body.trim() });
      setComposeOpen(false);
      setSubject("");
      setBody("");
      setThreads((prev) => [created, ...prev.filter((t) => t._id !== created._id)]);
      setActiveId(created._id);
      setActive(created);
      toast.success("Sent to IT Manager");
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not send");
    } finally {
      setCreating(false);
    }
  }

  async function onReply(e: FormEvent) {
    e.preventDefault();
    if (!activeId || !reply.trim()) return;
    setSending(true);
    try {
      const updated = await replyItThread(activeId, reply.trim());
      setActive(updated);
      setReply("");
      setThreads((prev) => [updated, ...prev.filter((t) => t._id !== updated._id)]);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Reply failed");
    } finally {
      setSending(false);
    }
  }

  async function toggleStatus() {
    if (!active) return;
    const next = active.status === "open" ? "closed" : "open";
    try {
      const updated = await setItThreadStatus(active._id, next);
      setActive(updated);
      setThreads((prev) => prev.map((t) => (t._id === updated._id ? { ...t, ...updated } : t)));
      toast.success(next === "closed" ? "Marked closed" : "Reopened");
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Update failed");
    }
  }

  return (
    <div>
      <ChapterPageHeader
        title="Contact IT"
        description="Send login, account, or tech questions to the org IT Manager. Keep chatting here until it is resolved."
        actions={
          <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
            <DialogTrigger asChild>
              <Button>
                <MessageSquarePlus className="h-4 w-4" />
                New query
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md sm:rounded-2xl">
              <form onSubmit={onCreate}>
                <DialogHeader>
                  <DialogTitle>New IT query</DialogTitle>
                  <DialogDescription>
                    Goes to the organization IT Manager (CEO dashboard). They reply in this chat.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 space-y-3">
                  <div className="space-y-1.5">
                    <Label>Subject</Label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Password reset needed"
                      required
                      maxLength={200}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Message</Label>
                    <Textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={5}
                      required
                    />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setComposeOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <p className="mb-3 text-sm text-muted-foreground">
        {unreadCount ? `${unreadCount} unread reply${unreadCount === 1 ? "" : "ies"}` : "No unread replies"}
      </p>

      <div className="grid min-h-[480px] gap-4 lg:grid-cols-[260px_1fr]">
        <ChapterCard className="overflow-hidden p-0 md:p-0">
          {loading ? (
            <div className="flex justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : threads.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No conversations yet. Start with New query.</p>
          ) : (
            <ul className="max-h-[65vh] divide-y divide-border overflow-y-auto">
              {threads.map((t) => (
                <li key={t._id}>
                  <button
                    type="button"
                    className={cn(
                      "w-full px-3 py-3 text-left hover:bg-muted/50",
                      activeId === t._id && "bg-muted",
                    )}
                    onClick={() => setActiveId(t._id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-sm font-medium", t.unread && "text-primary")}>{t.subject}</p>
                      {t.unread ? <Badge>New</Badge> : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.preview || "—"}</p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Badge variant="secondary">{t.status}</Badge>
                      <span>{formatWhen(t.lastMessageAt)}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ChapterCard>

        <ChapterCard className="flex min-h-[480px] flex-col overflow-hidden p-0 md:p-0">
          {!activeId ? (
            <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
              Select a conversation
            </div>
          ) : loadingThread && !active ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : active ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                <div>
                  <h2 className="font-medium">{active.subject}</h2>
                  <p className="text-xs text-muted-foreground">
                    Status: {active.status} · Updated {formatWhen(active.lastMessageAt)}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => void toggleStatus()}>
                  {active.status === "open" ? "Mark closed" : "Reopen"}
                </Button>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {(active.messages || []).map((m) => {
                  const mine =
                    typeof m.sender === "object" && m.sender?._id
                      ? m.sender._id === user?._id
                      : String(m.sender) === String(user?._id);
                  return (
                    <div
                      key={m._id}
                      className={cn("flex", mine ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                          mine ? "bg-primary text-primary-foreground" : "bg-muted",
                        )}
                      >
                        <p className="mb-1 text-[11px] opacity-80">
                          {mine ? "You" : senderName(m.sender)} · {formatWhen(m.createdAt)}
                        </p>
                        <p className="whitespace-pre-wrap">{m.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={onReply} className="border-t border-border p-3">
                <div className="flex gap-2">
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Write a reply…"
                    rows={2}
                    className="min-h-[64px]"
                  />
                  <Button type="submit" disabled={sending || !reply.trim()} className="self-end">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </form>
            </>
          ) : null}
        </ChapterCard>
      </div>
    </div>
  );
}
