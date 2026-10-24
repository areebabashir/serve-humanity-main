import { useCallback, useEffect, useState } from "react";
import { Download, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { downloadStyledAoaExcel } from "@/lib/excel-style";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { api, ApiRequestError } from "@/lib/api";

export interface OperationRecord {
  _id: string;
  caseNumber?: string;
  familyGuardianName?: string;
  city?: string;
  rashanStatus?: string;
}

const emptyForm = {
  caseNumber: "",
  familyGuardianName: "",
  city: "",
  rashanStatus: "Not Delivered",
};

function exportOperationExcel(rows: OperationRecord[]) {
  const header = ["Case Number", "Family Guardian Name", "City", "Rashan Status"];
  const data = [
    header,
    ...rows.map((r) => [
      r.caseNumber || "",
      r.familyGuardianName || "",
      r.city || "",
      r.rashanStatus || "",
    ]),
  ];
  downloadStyledAoaExcel(
    data,
    "Ration Cases Status File",
    `Ration-Cases-Status-File-${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}

export function OperationTeamPanel({ canWrite = true }: { canWrite?: boolean }) {
  const [rows, setRows] = useState<OperationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ success: true; data: OperationRecord[] }>(
        "/team-records?kind=operation",
      );
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

  function startEdit(r: OperationRecord) {
    setEditingId(r._id);
    setForm({
      caseNumber: r.caseNumber || "",
      familyGuardianName: r.familyGuardianName || "",
      city: r.city || "",
      rashanStatus: r.rashanStatus || "Not Delivered",
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function onSave() {
    if (!form.caseNumber.trim()) {
      toast.error("Case Number is required");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api(`/team-records/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(form),
        });
        toast.success("Operation record updated");
      } else {
        await api("/team-records", {
          method: "POST",
          body: JSON.stringify({ kind: "operation", ...form }),
        });
        toast.success("Operation record added");
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
    if (!confirm("Delete this operation record?")) return;
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
              {editingId ? "Edit operation row" : "Add operation row"}
            </h3>
            {editingId ? (
              <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                Cancel edit
              </Button>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Case Number</Label>
              <Input
                value={form.caseNumber}
                onChange={(e) => setField("caseNumber", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Family Guardian Name</Label>
              <Input
                value={form.familyGuardianName}
                onChange={(e) => setField("familyGuardianName", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">City</Label>
              <Input value={form.city} onChange={(e) => setField("city", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Rashan Status</Label>
              <Select value={form.rashanStatus} onValueChange={(v) => setField("rashanStatus", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Not Delivered">Not Delivered</SelectItem>
                </SelectContent>
              </Select>
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
          onClick={() => exportOperationExcel(rows)}
        >
          <Download className="h-4 w-4" />
          Download Excel
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case Number</TableHead>
              <TableHead>Family Guardian Name</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Rashan Status</TableHead>
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
                  No operation rows yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r._id}>
                  <TableCell className="font-mono text-xs font-medium">{r.caseNumber || "—"}</TableCell>
                  <TableCell>{r.familyGuardianName || "—"}</TableCell>
                  <TableCell>{r.city || "—"}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        r.rashanStatus === "Delivered"
                          ? "border-0 bg-emerald-500/15 text-emerald-700"
                          : "border-0 bg-amber-500/15 text-amber-700"
                      }
                    >
                      {r.rashanStatus || "—"}
                    </Badge>
                  </TableCell>
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
