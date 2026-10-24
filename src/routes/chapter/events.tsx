import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CalendarDays, Loader2, Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { ChapterPageHeader, ChapterCard } from "@/components/chapter/ChapterPage";
import { useChapterRole } from "@/components/chapter/ChapterGuard";
import { canWriteChapterModule } from "@/lib/chapterRoles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, ApiRequestError } from "@/lib/api";

type WebsiteEventRow = {
  _id: string;
  title: string;
  date: string;
  location: string;
  capacity?: string;
  description?: string;
  published?: boolean;
};

type RegistrationRow = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  note?: string;
  status?: string;
  createdAt: string;
};

const emptyForm = {
  title: "",
  date: "",
  location: "",
  capacity: "",
  description: "",
  published: true,
};

function toDateInput(iso: string) {
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export default function ChapterEventsPage() {
  const role = useChapterRole();
  const canWrite = canWriteChapterModule(role, "events");

  const [rows, setRows] = useState<WebsiteEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [regsOpen, setRegsOpen] = useState(false);
  const [regs, setRegs] = useState<RegistrationRow[]>([]);
  const [regsTitle, setRegsTitle] = useState("");
  const [regsLoading, setRegsLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ success: true; data: WebsiteEventRow[] }>(
        "/website-events/chapter/mine",
      );
      setRows(res.data || []);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(row: WebsiteEventRow) {
    setEditingId(row._id);
    setForm({
      title: row.title || "",
      date: toDateInput(row.date),
      location: row.location || "",
      capacity: row.capacity || "",
      description: row.description || "",
      published: row.published !== false,
    });
    setFormOpen(true);
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!canWrite) return;
    setSaving(true);
    try {
      const body = {
        title: form.title.trim(),
        date: form.date,
        location: form.location.trim(),
        capacity: form.capacity.trim(),
        description: form.description.trim(),
        published: form.published,
      };
      if (editingId) {
        await api(`/website-events/chapter/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("Event updated");
      } else {
        await api("/website-events/chapter", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Event posted — it will show on the public Events page when published");
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!canWrite) return;
    if (!confirm("Delete this event and its registrations?")) return;
    try {
      await api(`/website-events/chapter/${id}`, { method: "DELETE" });
      toast.success("Event deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Delete failed");
    }
  }

  async function openRegs(row: WebsiteEventRow) {
    setRegsTitle(row.title);
    setRegsOpen(true);
    setRegsLoading(true);
    try {
      const res = await api<{ success: true; data: RegistrationRow[] }>(
        `/website-events/chapter/${row._id}/registrations`,
      );
      setRegs(res.data || []);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load registrations");
      setRegs([]);
    } finally {
      setRegsLoading(false);
    }
  }

  return (
    <div>
      <ChapterPageHeader
        title="Events"
        description="Post chapter events to the public website. Visitors can register from /events."
        actions={
          canWrite ? (
            <Button onClick={openCreate} className="gap-1.5">
              <Plus className="h-4 w-4" /> Add event
            </Button>
          ) : null
        }
      />

      <ChapterCard>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <CalendarDays className="h-8 w-8 text-muted-foreground/70" />
            <p className="text-sm text-muted-foreground">
              No chapter events yet. Add one to show on the public Events page.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <article
                key={row._id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-background/60 p-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground">{row.title}</h3>
                    <Badge variant={row.published !== false ? "default" : "secondary"}>
                      {row.published !== false ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(row.date).toLocaleDateString()} · {row.location}
                    {row.capacity ? ` · ${row.capacity}` : ""}
                  </p>
                  {row.description ? (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{row.description}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => void openRegs(row)}>
                    <Users className="h-4 w-4" /> Registrations
                  </Button>
                  {canWrite ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                        <Pencil className="h-4 w-4" /> Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => void remove(row._id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </ChapterCard>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit event" : "Add chapter event"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSave} className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Date</Label>
                <Input
                  required
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  required
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Capacity (e.g. 200 volunteers)</Label>
              <Input
                value={form.capacity}
                onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="min-h-[88px]"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Publish on website</p>
                <p className="text-xs text-muted-foreground">Show on public /events page</p>
              </div>
              <Switch
                checked={form.published}
                onCheckedChange={(v) => setForm((f) => ({ ...f, published: v }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editingId ? "Save changes" : "Post event"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={regsOpen} onOpenChange={setRegsOpen}>
        <DialogContent className="max-w-lg sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle>Registrations — {regsTitle}</DialogTitle>
          </DialogHeader>
          {regsLoading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : regs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No registrations yet.</p>
          ) : (
            <ul className="max-h-[360px] space-y-2 overflow-y-auto">
              {regs.map((r) => (
                <li key={r._id} className="rounded-lg border px-3 py-2 text-sm">
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.email}
                    {r.phone ? ` · ${r.phone}` : ""}
                  </p>
                  {r.note ? <p className="mt-1 text-xs text-muted-foreground">{r.note}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
