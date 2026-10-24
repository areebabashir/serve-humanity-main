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

export interface VerificationRecord {
  _id: string;
  srNo?: number | null;
  caseDate?: string;
  caseType?: string;
  referenceName?: string;
  referenceContact?: string;
  caseStatus?: string;
  runStatus?: string;
  paymentStatus?: string;
  verifiedByMember?: string;
}

const emptyForm = {
  caseDate: "",
  caseType: "",
  referenceName: "",
  referenceContact: "",
  caseStatus: "unverified",
  runStatus: "Not Run",
  paymentStatus: "",
  verifiedByMember: "",
};

function exportVerificationExcel(rows: VerificationRecord[]) {
  const header = [
    "Sr. No",
    "CASE DATE",
    "CASE TYPE",
    "REFERENCE Name",
    "REFERENCE contact No.",
    "CASE Status",
    "CASE STATUS (Run)",
    "Payment Status",
    "Member name who verified it",
  ];
  const data = [
    header,
    ...rows.map((r) => [
      r.srNo ?? "",
      r.caseDate || "",
      r.caseType || "",
      r.referenceName || "",
      r.referenceContact || "",
      r.caseStatus || "",
      r.runStatus || "",
      r.paymentStatus || "",
      r.verifiedByMember || "",
    ]),
  ];
  downloadStyledAoaExcel(
    data,
    "Verification",
    `Team-Verification-${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}

export function VerificationTeamPanel({ canWrite = true }: { canWrite?: boolean }) {
  const [rows, setRows] = useState<VerificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ success: true; data: VerificationRecord[] }>(
        "/team-records?kind=verification",
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

  function startEdit(r: VerificationRecord) {
    setEditingId(r._id);
    setForm({
      caseDate: r.caseDate || "",
      caseType: r.caseType || "",
      referenceName: r.referenceName || "",
      referenceContact: r.referenceContact || "",
      caseStatus: r.caseStatus || "unverified",
      runStatus: r.runStatus || "Not Run",
      paymentStatus: r.paymentStatus || "",
      verifiedByMember: r.verifiedByMember || "",
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
        toast.success("Verification record updated");
      } else {
        await api("/team-records", {
          method: "POST",
          body: JSON.stringify({ kind: "verification", ...form }),
        });
        toast.success("Verification record added");
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
    if (!confirm("Delete this verification record?")) return;
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
              {editingId ? "Edit verification row" : "Add verification row"}
            </h3>
            {editingId ? (
              <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                Cancel edit
              </Button>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs">CASE DATE</Label>
              <Input
                type="date"
                value={form.caseDate}
                onChange={(e) => setField("caseDate", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">CASE TYPE</Label>
              <Input
                placeholder="e.g. Health, Ration"
                value={form.caseType}
                onChange={(e) => setField("caseType", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">REFERENCE Name</Label>
              <Input
                value={form.referenceName}
                onChange={(e) => setField("referenceName", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">REFERENCE contact No.</Label>
              <Input
                value={form.referenceContact}
                onChange={(e) => setField("referenceContact", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">CASE Status</Label>
              <Select value={form.caseStatus} onValueChange={(v) => setField("caseStatus", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">CASE STATUS</Label>
              <Select value={form.runStatus} onValueChange={(v) => setField("runStatus", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Run">Run</SelectItem>
                  <SelectItem value="Not Run">Not Run</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Payment Status</Label>
              <Input
                placeholder="e.g. Paid, Pending"
                value={form.paymentStatus}
                onChange={(e) => setField("paymentStatus", e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Member name who verified it</Label>
              <Input
                value={form.verifiedByMember}
                onChange={(e) => setField("verifiedByMember", e.target.value)}
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
          onClick={() => exportVerificationExcel(rows)}
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
              <TableHead>CASE DATE</TableHead>
              <TableHead>CASE TYPE</TableHead>
              <TableHead>REFERENCE Name</TableHead>
              <TableHead>REFERENCE contact No.</TableHead>
              <TableHead>CASE Status</TableHead>
              <TableHead>CASE STATUS</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Verified by</TableHead>
              {canWrite ? <TableHead className="text-right">Action</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={canWrite ? 10 : 9} className="text-muted-foreground">
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canWrite ? 10 : 9} className="text-muted-foreground">
                  No verification rows yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r._id}>
                  <TableCell className="font-mono text-xs">{r.srNo ?? "—"}</TableCell>
                  <TableCell>{r.caseDate || "—"}</TableCell>
                  <TableCell>{r.caseType || "—"}</TableCell>
                  <TableCell className="font-medium">{r.referenceName || "—"}</TableCell>
                  <TableCell>{r.referenceContact || "—"}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        r.caseStatus === "verified"
                          ? "border-0 bg-emerald-500/15 text-emerald-700"
                          : "border-0 bg-amber-500/15 text-amber-700"
                      }
                    >
                      {r.caseStatus || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        r.runStatus === "Run"
                          ? "border-0 bg-emerald-500/15 text-emerald-700"
                          : "border-0 bg-amber-500/15 text-amber-700"
                      }
                    >
                      {r.runStatus || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell>{r.paymentStatus || "—"}</TableCell>
                  <TableCell>{r.verifiedByMember || "—"}</TableCell>
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
