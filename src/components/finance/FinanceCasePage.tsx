import { Fragment, useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  FileSpreadsheet,
  CloudUpload,
  Check,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader, PageShell } from "@/components/dashboard/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, ApiRequestError } from "@/lib/api";
import {
  emptyCaseFields,
  fmtPKR,
  type FinanceCaseFields,
} from "@/lib/finance";
import {
  downloadMonthlyCasesExcel,
  buildMonthlyCasesExcel,
  type MonthlyCaseRow,
} from "@/lib/finance-case-export";

export interface FinanceAttachment {
  _id?: string;
  key: string;
  name?: string;
  url?: string;
  publicId?: string;
  note?: string;
  driveFileId?: string;
  driveWebViewLink?: string;
  drivePath?: string;
}

export interface FinanceRecord {
  _id: string;
  type: string;
  title?: string;
  month?: string;
  chapter?: { _id: string; name: string; city?: string } | string | null;
  fields?: Record<string, unknown>;
  attachments?: FinanceAttachment[];
  notes?: string;
  status?: string;
  approvalStatus?: string;
  createdAt?: string;
  createdBy?: { name?: string; email?: string };
  pdfDriveFileId?: string;
  pdfDriveWebViewLink?: string;
  pdfDrivePath?: string;
  pdfDriveUploadedAt?: string;
  excelDriveFileId?: string;
  excelDriveWebViewLink?: string;
  excelDrivePath?: string;
  excelDriveUploadedAt?: string;
}

export type ChapterScope = { chapterId: string; chapterName: string };

interface ChapterOption {
  _id: string;
  name: string;
  city?: string;
}

type FormCase = FinanceCaseFields & { id: string };

function getTokenHeader(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("sh_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

async function uploadExcelToDrive(
  blob: Blob,
  filename: string,
  meta: { chapterName?: string; month?: string; financeId?: string },
) {
  const form = new FormData();
  form.append(
    "file",
    new File([blob], filename, {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
  form.append("kind", "excel");
  form.append("financeType", "case");
  form.append("chapterName", meta.chapterName || "");
  form.append("month", meta.month || "");
  form.append("teamName", `${meta.month || "Month"} Month Cases`);
  if (meta.financeId) form.append("financeId", meta.financeId);

  const res = await fetch(`${API_BASE}/finance-files/upload-export`, {
    method: "POST",
    headers: getTokenHeader(),
    body: form,
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new ApiRequestError(data.message || "Drive upload failed", res.status);
  return data.data as {
    updated?: boolean;
    driveWebViewLink?: string;
    driveFileId?: string;
    drivePath?: string;
  };
}

function chapterId(chapter: FinanceRecord["chapter"]): string {
  if (!chapter) return "";
  if (typeof chapter === "string") return chapter;
  return chapter._id;
}

function chapterName(chapter: FinanceRecord["chapter"]): string {
  if (!chapter) return "—";
  if (typeof chapter === "string") return chapter;
  return chapter.name;
}

function newFormCase(): FormCase {
  return {
    id: `case-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ...emptyCaseFields(),
    collaboration: "NILL",
  };
}

/** Read cases from one monthly file (supports old single-case / caseTitle records). */
function getCasesFromRecord(row: FinanceRecord): FinanceCaseFields[] {
  const f = row.fields || {};
  const nested = f.cases;
  if (Array.isArray(nested) && nested.length > 0) {
    return nested.map((c) => {
      const raw = c as unknown as FinanceCaseFields & { caseTitle?: string };
      return {
        ...emptyCaseFields(),
        ...raw,
        caseNo: raw.caseNo || raw.caseTitle || "",
        firstReferencePhone: raw.firstReferencePhone || "",
      };
    });
  }
  // Legacy: one case stored flat on fields
  if (f.caseNo || f.caseTitle || f.amount != null) {
    const raw = f as unknown as FinanceCaseFields & { caseTitle?: string };
    return [
      {
        ...emptyCaseFields(),
        ...raw,
        caseNo: raw.caseNo || raw.caseTitle || "",
        firstReferencePhone: raw.firstReferencePhone || "",
      },
    ];
  }
  return [];
}

function casesToExportRows(cases: FinanceCaseFields[]): MonthlyCaseRow[] {
  return cases.map((c) => ({
    caseNo: c.caseNo || "",
    beneficiaryName: c.beneficiaryName || "",
    amount: Number(c.amount) || 0,
    date: c.date || "",
    collaboration: c.collaboration || "NILL",
    receiverName: c.receiverName || "",
    firstReference: c.firstReference || "",
    firstReferencePhone: c.firstReferencePhone || "",
    secondReference: c.secondReference || "",
  }));
}

function casesTotal(cases: FinanceCaseFields[]): number {
  return cases.reduce((s, c) => s + (Number(c.amount) || 0), 0);
}

function normalizeCaseForSave(c: FinanceCaseFields): FinanceCaseFields {
  return {
    caseNo: c.caseNo.trim(),
    beneficiaryName: (c.beneficiaryName || "").trim(),
    amount: c.amount === "" ? "" : Number(c.amount),
    date: c.date || "",
    collaboration: c.collaboration || "NILL",
    receiverName: (c.receiverName || "").trim(),
    firstReference: (c.firstReference || "").trim(),
    firstReferencePhone: (c.firstReferencePhone || "").trim(),
    secondReference: (c.secondReference || "").trim(),
  };
}

export function FinanceCasePage({ scope }: { scope?: ChapterScope } = {}) {
  const isScoped = Boolean(scope);
  const [rows, setRows] = useState<FinanceRecord[]>([]);
  const [chapters, setChapters] = useState<ChapterOption[]>([]);
  const [chapterFilter, setChapterFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [exportBusy, setExportBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [chapter, setChapter] = useState("");
  const [month, setMonth] = useState("");
  const [status, setStatus] = useState("draft");
  const [description, setDescription] = useState("");
  const [formCases, setFormCases] = useState<FormCase[]>([newFormCase()]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ type: "case", limit: "200" });
      if (scope) {
        qs.set("chapter", scope.chapterId);
      } else if (chapterFilter !== "all") {
        qs.set("chapter", chapterFilter);
      }
      if (monthFilter.trim()) qs.set("month", monthFilter.trim());
      if (scope) {
        const listRes = await api<{ success: true; data: FinanceRecord[] }>(`/finance-files?${qs}`);
        setRows(listRes.data);
      } else {
        const [listRes, chapRes] = await Promise.all([
          api<{ success: true; data: FinanceRecord[] }>(`/finance-files?${qs}`),
          api<{ success: true; data: ChapterOption[] }>("/chapters"),
        ]);
        setRows(listRes.data);
        setChapters(chapRes.data);
      }
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load case files");
    } finally {
      setLoading(false);
    }
  }, [chapterFilter, monthFilter, scope]);

  useEffect(() => {
    void load();
  }, [load]);

  const listedTotal = useMemo(
    () => rows.reduce((s, r) => s + casesTotal(getCasesFromRecord(r)), 0),
    [rows],
  );

  const formTotal = useMemo(() => casesTotal(formCases), [formCases]);

  function updateFormCase(id: string, patch: Partial<FinanceCaseFields>) {
    setFormCases((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function openCreate() {
    setEditing(null);
    setChapter(scope?.chapterId ?? (chapterFilter !== "all" ? chapterFilter : ""));
    setMonth(monthFilter || "");
    setStatus("draft");
    setDescription("");
    setFormCases([newFormCase()]);
    setOpen(true);
  }

  function openEdit(row: FinanceRecord) {
    setEditing(row);
    setChapter(chapterId(row.chapter));
    setMonth(row.month || "");
    setStatus(row.status || "draft");
    setDescription(row.notes || String((row.fields as { description?: string })?.description || ""));
    const cases = getCasesFromRecord(row);
    setFormCases(
      cases.length
        ? cases.map((c) => ({
            id: `case-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            ...emptyCaseFields(),
            ...c,
          }))
        : [newFormCase()],
    );
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!month.trim()) {
      toast.error("Month is required");
      return;
    }

    const filled = formCases.filter((c) => c.caseNo.trim());
    if (filled.length === 0) {
      toast.error("Add at least one case with a case no");
      return;
    }
    for (const c of filled) {
      if (c.amount === "" || c.amount == null) {
        toast.error(`Amount required for case: ${c.caseNo}`);
        return;
      }
      if (!String(c.receiverName || "").trim()) {
        toast.error(`Receiver required for case: ${c.caseNo}`);
        return;
      }
    }

    const cases = filled.map(normalizeCaseForSave);
    const total = casesTotal(cases);
    const monthLabel = month.trim();

    // ONE finance file for the whole form
    const payload = {
      type: "case",
      title: `${monthLabel} Month Cases`,
      month: monthLabel,
      chapter: chapter || null,
      status,
      notes: description.trim(),
      fields: {
        cases,
        totalAmount: total,
        caseCount: cases.length,
        description: description.trim(),
      },
      attachments: [],
    };

    setSaving(true);
    try {
      if (editing) {
        await api(`/finance-files/${editing._id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Monthly case file updated");
      } else {
        await api("/finance-files", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success(
          `Saved 1 file with ${cases.length} case${cases.length === 1 ? "" : "s"} for ${monthLabel}`,
        );
      }
      setOpen(false);
      if (!monthFilter.trim()) setMonthFilter(monthLabel);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this monthly case file and all cases inside it?")) return;
    try {
      await api(`/finance-files/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Delete failed");
    }
  }

  function exportInputFor(row: FinanceRecord) {
    return {
      month: row.month || monthFilter || "Month",
      chapterName: chapterName(row.chapter) === "—" ? "" : chapterName(row.chapter),
      cases: casesToExportRows(getCasesFromRecord(row)),
      description:
        row.notes ||
        String((row.fields as { description?: string })?.description || ""),
      generatedBy: row.createdBy?.name,
    };
  }

  async function handleExcel(row: FinanceRecord) {
    const cases = getCasesFromRecord(row);
    if (cases.length === 0) {
      toast.error("No cases in this file");
      return;
    }
    setExportBusy(`xlsx-${row._id}`);
    try {
      downloadMonthlyCasesExcel(exportInputFor(row));
      toast.success("Excel downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Excel failed");
    } finally {
      setExportBusy(null);
    }
  }

  async function handleExcelToDrive(row: FinanceRecord) {
    const cases = getCasesFromRecord(row);
    if (cases.length === 0) {
      toast.error("No cases in this file");
      return;
    }
    setExportBusy(`drive-${row._id}`);
    try {
      const input = exportInputFor(row);
      const { blob, filename } = buildMonthlyCasesExcel(input);
      const drive = await uploadExcelToDrive(blob, filename, {
        chapterName: input.chapterName,
        month: row.month || "",
        financeId: row._id,
      });
      setRows((prev) =>
        prev.map((r) =>
          r._id === row._id
            ? {
                ...r,
                excelDriveFileId: drive.driveFileId || r.excelDriveFileId,
                excelDriveWebViewLink: drive.driveWebViewLink || r.excelDriveWebViewLink,
                excelDrivePath: drive.drivePath || r.excelDrivePath,
                excelDriveUploadedAt: new Date().toISOString(),
              }
            : r,
        ),
      );
      toast.success(drive.updated ? "Excel updated on Drive" : "Excel uploaded to Google Drive");
      if (drive.driveWebViewLink) {
        window.open(drive.driveWebViewLink, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Drive upload failed");
    } finally {
      setExportBusy(null);
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Finance Case Files"
        description="One form = one monthly file. Add many cases inside the form; they save together."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New monthly file
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        {!isScoped ? (
          <div className="space-y-1">
            <Label className="text-xs">Chapter</Label>
            <Select value={chapterFilter} onValueChange={setChapterFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All chapters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All chapters</SelectItem>
                {chapters.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="space-y-1">
          <Label className="text-xs">Month</Label>
          <Input
            className="w-[180px]"
            placeholder="e.g. January"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          />
        </div>
        <div className="ml-auto rounded-lg border border-border bg-card px-4 py-2 text-sm">
          Files: <span className="font-semibold">{rows.length}</span> · Total{" "}
          <span className="font-semibold">{fmtPKR(listedTotal)}</span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
        {loading ? (
          <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Month</TableHead>
                {!isScoped ? <TableHead>Chapter</TableHead> : null}
                <TableHead>Cases</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isScoped ? 6 : 7} className="text-center text-muted-foreground">
                    No monthly case files yet. Click “New monthly file” and add all cases in one form.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const cases = getCasesFromRecord(row);
                  const total = casesTotal(cases);
                  const isOpen = expanded === row._id;
                  return (
                    <Fragment key={row._id}>
                      <TableRow>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setExpanded(isOpen ? null : row._id)}
                          >
                            {isOpen ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">{row.month || "—"}</TableCell>
                        {!isScoped ? <TableCell>{chapterName(row.chapter)}</TableCell> : null}
                        <TableCell>
                          <Badge variant="secondary">{cases.length} cases</Badge>
                          {row.excelDriveFileId ? (
                            <Badge variant="outline" className="ml-1 text-[10px]">
                              Drive
                            </Badge>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{row.status || "draft"}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{fmtPKR(total)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-0.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Download Excel"
                              disabled={exportBusy === `xlsx-${row._id}`}
                              onClick={() => void handleExcel(row)}
                            >
                              {exportBusy === `xlsx-${row._id}` ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <FileSpreadsheet className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              title={
                                row.excelDriveFileId
                                  ? "On Google Drive — click to update"
                                  : "Upload Excel to Drive"
                              }
                              disabled={exportBusy === `drive-${row._id}`}
                              onClick={() => void handleExcelToDrive(row)}
                            >
                              {exportBusy === `drive-${row._id}` ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : row.excelDriveFileId ? (
                                <Check className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <CloudUpload className="h-4 w-4" />
                              )}
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => openEdit(row)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => void onDelete(row._id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isOpen ? (
                        <TableRow>
                          <TableCell colSpan={isScoped ? 6 : 7} className="bg-muted/30 p-0">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Case No</TableHead>
                                  <TableHead>Beneficiary</TableHead>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Collaboration</TableHead>
                                  <TableHead>Receiver</TableHead>
                                  <TableHead>1st Ref</TableHead>
                                  <TableHead>1st Ref Phn</TableHead>
                                  <TableHead>2nd Ref (SH)</TableHead>
                                  <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {cases.map((c, i) => (
                                  <TableRow key={`${row._id}-${i}`}>
                                    <TableCell>{c.caseNo || "—"}</TableCell>
                                    <TableCell>{c.beneficiaryName || "—"}</TableCell>
                                    <TableCell>{c.date || "—"}</TableCell>
                                    <TableCell>{c.collaboration || "NILL"}</TableCell>
                                    <TableCell>{c.receiverName || "—"}</TableCell>
                                    <TableCell>{c.firstReference || "—"}</TableCell>
                                    <TableCell>{c.firstReferencePhone || "—"}</TableCell>
                                    <TableCell>{c.secondReference || "—"}</TableCell>
                                    <TableCell className="text-right">
                                      {fmtPKR(Number(c.amount) || 0)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            {row.notes ||
                            (row.fields as { description?: string })?.description ? (
                              <p className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">Description: </span>
                                {row.notes ||
                                  String(
                                    (row.fields as { description?: string }).description || "",
                                  )}
                              </p>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit monthly case file" : "New monthly case file"}
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
            <p className="text-sm text-muted-foreground">
              All cases below are saved in <strong>one</strong> file for this month.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Month *</Label>
                <Input
                  placeholder="January"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  required
                />
              </div>
              {!isScoped ? (
                <div className="space-y-1.5">
                  <Label>Chapter</Label>
                  <Select
                    value={chapter || "none"}
                    onValueChange={(v) => setChapter(v === "none" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select chapter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {chapters.map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.name}
                          {c.city ? ` (${c.city})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  Cases in this file ({formCases.length}) · {fmtPKR(formTotal)}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setFormCases((prev) => [...prev, newFormCase()])}
                >
                  <Plus className="h-3.5 w-3.5" /> Add another case
                </Button>
              </div>

              {formCases.map((c, idx) => (
                <div
                  key={c.id}
                  className="space-y-3 rounded-lg border border-border bg-muted/20 p-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Case {idx + 1}
                    </p>
                    {formCases.length > 1 ? (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          setFormCases((prev) => prev.filter((x) => x.id !== c.id))
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    ) : null}
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Case No *</Label>
                      <Input
                        placeholder="e.g. 134"
                        value={c.caseNo}
                        onChange={(e) => updateFormCase(c.id, { caseNo: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Beneficiary</Label>
                      <Input
                        value={c.beneficiaryName}
                        onChange={(e) =>
                          updateFormCase(c.id, { beneficiaryName: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Amount (PKR) *</Label>
                      <Input
                        type="number"
                        value={c.amount === "" ? "" : c.amount}
                        onChange={(e) =>
                          updateFormCase(c.id, {
                            amount: e.target.value === "" ? "" : Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Date</Label>
                      <Input
                        type="date"
                        value={c.date}
                        onChange={(e) => updateFormCase(c.id, { date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Collaboration</Label>
                      <Input
                        placeholder="NILL or See Note"
                        value={c.collaboration}
                        onChange={(e) =>
                          updateFormCase(c.id, { collaboration: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Receiver *</Label>
                      <Input
                        value={c.receiverName}
                        onChange={(e) =>
                          updateFormCase(c.id, { receiverName: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">1st Reference</Label>
                      <Input
                        value={c.firstReference}
                        onChange={(e) =>
                          updateFormCase(c.id, { firstReference: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">1st Reference Phn No</Label>
                      <Input
                        placeholder="Phone number"
                        value={c.firstReferencePhone}
                        onChange={(e) =>
                          updateFormCase(c.id, { firstReferencePhone: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs">2nd Reference (Serve Humanity)</Label>
                      <Input
                        value={c.secondReference}
                        onChange={(e) =>
                          updateFormCase(c.id, { secondReference: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 rounded-lg border border-border p-3">
              <Label>Description (last entry)</Label>
              <Textarea
                placeholder="Add a final description / notes for this monthly file…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editing
                  ? "Save file"
                  : `Save 1 file (${formCases.filter((c) => c.caseNo.trim()).length || 0} cases)`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
