import { useCallback, useEffect, useState } from "react";
import { Download, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { downloadStyledAoaExcel } from "@/lib/excel-style";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, ApiRequestError } from "@/lib/api";

export interface MediaRecord {
  _id: string;
  srNo?: number | null;
  caseDate?: string;
  refNo?: string;
  description?: string;
}

const emptyForm = {
  caseDate: "",
  refNo: "",
  description: "",
};

function exportMediaExcel(rows: MediaRecord[]) {
  const header = ["Sr. No", "DATE", "REF NO", "DESCRIPTION"];
  const data = [
    header,
    ...rows.map((r) => [r.srNo ?? "", r.caseDate || "", r.refNo || "", r.description || ""]),
  ];
  downloadStyledAoaExcel(
    data,
    "Ref File",
    `Media-Ref-File-${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}

export function MediaTeamPanel({ canWrite = true }: { canWrite?: boolean }) {
  const [rows, setRows] = useState<MediaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ success: true; data: MediaRecord[] }>("/team-records?kind=media");
      setRows(res.data || []);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load records");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function setField(key: keyof typeof emptyForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function startEdit(r: MediaRecord) {
    setEditingId(r._id);
    setForm({
      caseDate: r.caseDate || "",
      refNo: r.refNo || "",
      description: r.description || "",
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function onSave() {
    setSaving(true);
    try {
      if (editingId) {
        await api(`/team-records/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(form),
        });
        toast.success("Ref file row updated");
      } else {
        await api("/team-records", {
          method: "POST",
          body: JSON.stringify({ kind: "media", ...form }),
        });
        toast.success("Ref file row added");
      }
      resetForm();
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this ref file row?")) return;
    try {
      await api(`/team-records/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-5">
      {canWrite ? (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft md:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">
              {editingId ? "Edit ref file row" : "Add ref file row"}
            </h3>
            {editingId ? (
              <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                Cancel edit
              </Button>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">DATE</Label>
              <Input
                type="date"
                value={form.caseDate}
                onChange={(e) => setField("caseDate", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">REF NO</Label>
              <Input
                value={form.refNo}
                onChange={(e) => setField("refNo", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">DESCRIPTION</Label>
              <Input
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4">
            <Button disabled={saving} onClick={() => void onSave()}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingId ? (
                <Pencil className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {editingId ? "Update record" : "Add to file"}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading…" : `${rows.length} row${rows.length === 1 ? "" : "s"}`}
        </p>
        <Button
          variant="outline"
          size="sm"
          disabled={!rows.length}
          onClick={() => exportMediaExcel(rows)}
        >
          <Download className="h-4 w-4" />
          Download Excel
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sr. No</TableHead>
              <TableHead>DATE</TableHead>
              <TableHead>REF NO</TableHead>
              <TableHead>DESCRIPTION</TableHead>
              {canWrite ? <TableHead className="text-right">Action</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={canWrite ? 5 : 4} className="text-muted-foreground">
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canWrite ? 5 : 4} className="text-muted-foreground">
                  No ref file rows yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r._id}>
                  <TableCell className="font-mono text-xs">{r.srNo ?? "—"}</TableCell>
                  <TableCell>{r.caseDate || "—"}</TableCell>
                  <TableCell className="font-medium">{r.refNo || "—"}</TableCell>
                  <TableCell>{r.description || "—"}</TableCell>
                  {canWrite ? (
                    <TableCell className="space-x-1 text-right">
                      <Button size="sm" variant="outline" onClick={() => startEdit(r)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => void onDelete(r._id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
