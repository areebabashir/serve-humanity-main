import { Fragment, useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Upload,
  ChevronDown,
  ChevronRight,
  FileDown,
  CloudUpload,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader, PageShell } from "@/components/dashboard/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { useAuth } from "@/lib/auth";
import { isCabinetForModuleUser } from "@/lib/chapterRoles";
import {
  ApprovalStatusBadge,
  SubmissionApprovalActions,
} from "@/components/chapter/SubmissionApproval";
import {
  calcDonationTotals,
  emptyCabinetMember,
  emptyDonationPerson,
  emptyMonthlyDonationFields,
  fmtPKR,
  type CabinetMemberBlock,
  type DonationPerson,
  type MonthlyDonationFields,
} from "@/lib/finance";
import {
  buildMonthlyDonationPdf,
  downloadMonthlyDonationPdf,
  type MonthlyDonationExportInput,
} from "@/lib/finance-donation-export";
import type { FinanceAttachment, FinanceRecord } from "./FinanceCasePage";

export type ChapterScope = { chapterId: string; chapterName: string };

interface ChapterOption {
  _id: string;
  name: string;
  city?: string;
}

function getTokenHeader(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("sh_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

async function uploadFile(
  file: File,
  meta?: { chapterName?: string; month?: string; teamName?: string; attachmentKey?: string },
): Promise<{
  url: string;
  publicId: string;
  name: string;
  driveFileId?: string;
  driveWebViewLink?: string;
  drivePath?: string;
}> {
  const form = new FormData();
  form.append("file", file);
  form.append("financeType", "monthly_donation");
  form.append("chapterName", meta?.chapterName || "");
  form.append("month", meta?.month || "");
  form.append("teamName", meta?.teamName || "");
  form.append("attachmentKey", meta?.attachmentKey || "screenshots");
  const res = await fetch(`${API_BASE}/finance-files/upload`, {
    method: "POST",
    headers: getTokenHeader(),
    body: form,
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new ApiRequestError(data.message || "Upload failed", res.status);
  return data.data;
}

async function uploadExportToDrive(
  blob: Blob,
  filename: string,
  meta: {
    chapterName?: string;
    month?: string;
    teamName?: string;
    financeId?: string;
  },
) {
  const form = new FormData();
  form.append("file", new File([blob], filename, { type: "application/pdf" }));
  form.append("financeType", "monthly_donation");
  form.append("chapterName", meta.chapterName || "");
  form.append("month", meta.month || "");
  form.append("teamName", meta.teamName || "");
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
    kind: string;
    updated?: boolean;
    driveSynced?: boolean;
    drivePath?: string;
    driveWebViewLink?: string;
    driveFileId?: string;
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

function toExportInput(row: FinanceRecord): MonthlyDonationExportInput {
  const f = {
    ...emptyMonthlyDonationFields(),
    ...(row.fields as unknown as MonthlyDonationFields),
  };
  return {
    title: row.title,
    month: row.month,
    chapterName: chapterName(row.chapter) === "—" ? "" : chapterName(row.chapter),
    status: row.status,
    fields: f,
    attachments: row.attachments || [],
    generatedBy: row.createdBy?.name,
  };
}

function SsUpload({
  attachmentKey,
  attachments,
  setAttachments,
  uploadMeta,
}: {
  attachmentKey: string;
  attachments: FinanceAttachment[];
  setAttachments: React.Dispatch<React.SetStateAction<FinanceAttachment[]>>;
  uploadMeta?: { chapterName?: string; month?: string; teamName?: string };
}) {
  const [busy, setBusy] = useState(false);
  const current = attachments.filter((a) => a.key === attachmentKey);

  async function onPick(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      const uploaded: FinanceAttachment[] = [];
      for (const file of Array.from(files)) {
        const data = await uploadFile(file, {
          ...uploadMeta,
          attachmentKey,
        });
        uploaded.push({
          key: attachmentKey,
          name: data.name,
          url: data.url,
          publicId: data.publicId,
          driveFileId: data.driveFileId,
          driveWebViewLink: data.driveWebViewLink,
          drivePath: data.drivePath,
        });
      }
      setAttachments((prev) => [...prev.filter((a) => a.key !== attachmentKey), ...uploaded]);
      toast.success("Screenshot uploaded");
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm" disabled={busy} asChild>
        <label className="cursor-pointer">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          SS
          <input
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => void onPick(e.target.files)}
          />
        </label>
      </Button>
      {current.map((a, i) => (
        <a
          key={a.publicId || i}
          href={a.url}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-primary underline"
        >
          {a.name || "View"}
        </a>
      ))}
    </div>
  );
}

function PersonRows({
  title,
  people,
  onChange,
  attachments,
  setAttachments,
  showDescription,
  uploadMeta,
}: {
  title: string;
  people: DonationPerson[];
  onChange: (next: DonationPerson[]) => void;
  attachments: FinanceAttachment[];
  setAttachments: React.Dispatch<React.SetStateAction<FinanceAttachment[]>>;
  showDescription?: boolean;
  uploadMeta?: { chapterName?: string; month?: string; teamName?: string };
}) {
  return (
    <div className="space-y-2 rounded-lg border border-border/80 p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{title}</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onChange([...people, emptyDonationPerson(title.slice(0, 3).toLowerCase())])}
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>
      {people.length === 0 ? (
        <p className="text-xs text-muted-foreground">None added.</p>
      ) : (
        people.map((p, idx) => (
          <div key={p.id} className="grid gap-2 sm:grid-cols-12">
            <Input
              className="sm:col-span-4"
              placeholder="Name"
              value={p.name}
              onChange={(e) => {
                const next = [...people];
                next[idx] = { ...p, name: e.target.value };
                onChange(next);
              }}
            />
            <Input
              className="sm:col-span-2"
              type="number"
              placeholder="Amount"
              value={p.amount === "" ? "" : p.amount}
              onChange={(e) => {
                const next = [...people];
                next[idx] = {
                  ...p,
                  amount: e.target.value === "" ? "" : Number(e.target.value),
                };
                onChange(next);
              }}
            />
            {showDescription ? (
              <Input
                className="sm:col-span-3"
                placeholder="Description"
                value={p.description || ""}
                onChange={(e) => {
                  const next = [...people];
                  next[idx] = { ...p, description: e.target.value };
                  onChange(next);
                }}
              />
            ) : (
              <div className="sm:col-span-3" />
            )}
            <div className="flex items-center gap-1 sm:col-span-3">
              <SsUpload
                attachmentKey={p.ssKey}
                attachments={attachments}
                setAttachments={setAttachments}
                uploadMeta={uploadMeta}
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => onChange(people.filter((_, i) => i !== idx))}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export function FinanceDonationPage({ scope }: { scope?: ChapterScope } = {}) {
  const { user } = useAuth();
  const isCabinet = isCabinetForModuleUser(user, "finance");
  const isScoped = Boolean(scope);
  const [rows, setRows] = useState<FinanceRecord[]>([]);
  const [chapters, setChapters] = useState<ChapterOption[]>([]);
  const [chapterFilter, setChapterFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [reviewBusy, setReviewBusy] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [exportBusy, setExportBusy] = useState<string | null>(null);
  const [driveBusy, setDriveBusy] = useState<string | null>(null);

  const [chapter, setChapter] = useState("");
  const [month, setMonth] = useState("");
  const [status, setStatus] = useState("draft");
  const [fields, setFields] = useState<MonthlyDonationFields>(emptyMonthlyDonationFields());
  const [attachments, setAttachments] = useState<FinanceAttachment[]>([]);
  const [syncToDriveOnSave, setSyncToDriveOnSave] = useState(true);

  async function onReview(id: string, approvalStatus: "approved" | "rejected") {
    setReviewBusy(id);
    try {
      await api(`/finance-files/${id}/review`, {
        method: "PATCH",
        body: JSON.stringify({ approvalStatus }),
      });
      toast.success(approvalStatus === "approved" ? "File approved" : "File rejected");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Review failed");
    } finally {
      setReviewBusy(null);
    }
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ type: "monthly_donation", limit: "100" });
      if (scope) {
        qs.set("chapter", scope.chapterId);
      } else if (chapterFilter !== "all") {
        qs.set("chapter", chapterFilter);
      }
      if (scope) {
        const listRes = await api<{ success: true; data: FinanceRecord[]; canReview?: boolean }>(
          `/finance-files?${qs}`,
        );
        setRows(listRes.data);
        setCanReview(Boolean(listRes.canReview));
      } else {
        const [listRes, chapRes] = await Promise.all([
          api<{ success: true; data: FinanceRecord[]; canReview?: boolean }>(`/finance-files?${qs}`),
          api<{ success: true; data: ChapterOption[] }>("/chapters"),
        ]);
        setRows(listRes.data);
        setCanReview(Boolean(listRes.canReview));
        setChapters(chapRes.data);
      }
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load donation files");
    } finally {
      setLoading(false);
    }
  }, [chapterFilter, scope]);

  useEffect(() => {
    void load();
  }, [load]);

  const liveTotals = useMemo(() => calcDonationTotals(fields), [fields]);

  const formUploadMeta = useMemo(() => {
    if (scope) {
      return {
        chapterName: scope.chapterName,
        month,
        teamName: fields.teamName || "Finance",
      };
    }
    const chap = chapters.find((c) => c._id === chapter);
    return {
      chapterName: chap?.name || "",
      month,
      teamName: fields.teamName || "Finance",
    };
  }, [scope, chapters, chapter, month, fields.teamName]);

  function openCreate() {
    setEditing(null);
    setChapter(scope?.chapterId ?? (chapterFilter !== "all" ? chapterFilter : ""));
    setMonth("");
    setStatus("draft");
    setFields(emptyMonthlyDonationFields());
    setAttachments([]);
    setSyncToDriveOnSave(true);
    setOpen(true);
  }

  function openEdit(row: FinanceRecord) {
    setEditing(row);
    setChapter(chapterId(row.chapter));
    setMonth(row.month || "");
    setStatus(row.status || "draft");
    setFields({
      ...emptyMonthlyDonationFields(),
      ...(row.fields as unknown as MonthlyDonationFields),
      cabinetMembers: ((row.fields as unknown as MonthlyDonationFields)?.cabinetMembers || []).map((c) => ({
        ...emptyCabinetMember(),
        ...c,
        role: c.role || "",
        directors: c.directors || [],
        assistantDirectors: c.assistantDirectors || [],
      })),
      alumni: ((row.fields as unknown as MonthlyDonationFields)?.alumni || []).map((a) => ({
        ...emptyDonationPerson("al"),
        ...a,
      })),
      otherAccountName: (row.fields as unknown as MonthlyDonationFields)?.otherAccountName || "",
      otherAccountAmount: (row.fields as unknown as MonthlyDonationFields)?.otherAccountAmount ?? "",
    });
    setAttachments(row.attachments || []);
    setSyncToDriveOnSave(true);
    setOpen(true);
  }

  function updateCabinet(idx: number, patch: Partial<CabinetMemberBlock>) {
    setFields((prev) => {
      const cabinetMembers = [...prev.cabinetMembers];
      cabinetMembers[idx] = { ...cabinetMembers[idx], ...patch };
      return { ...prev, cabinetMembers };
    });
  }

  async function syncRowToDrive(record: FinanceRecord) {
    const input = toExportInput(record);
    const chap =
      chapterName(record.chapter) === "—" ? "" : chapterName(record.chapter);
    const teamName = input.fields.teamName || "Finance";

    const pdf = await buildMonthlyDonationPdf(input);
    const pdfDrive = await uploadExportToDrive(pdf.blob, pdf.filename, {
      chapterName: chap,
      month: record.month || "",
      teamName,
      financeId: record._id,
    });

    return { pdfDrive };
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!month.trim()) {
      toast.error("Month is required");
      return;
    }
    setSaving(true);
    try {
      const totals = calcDonationTotals(fields);
      const payload = {
        type: "monthly_donation",
        title: `${month} — ${fields.teamName || "Finance"} Team Donations`,
        month,
        chapter: chapter || null,
        status,
        fields: { ...fields, totals },
        attachments,
      };

      let saved: FinanceRecord;
      if (editing) {
        const res = await api<{ success: true; data: FinanceRecord }>(
          `/finance-files/${editing._id}`,
          { method: "PATCH", body: JSON.stringify(payload) },
        );
        saved = res.data;
        toast.success("Donation file updated");
      } else {
        const res = await api<{ success: true; data: FinanceRecord }>("/finance-files", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        saved = res.data;
        toast.success("Donation file created");
      }

      if (syncToDriveOnSave && saved?._id) {
        try {
          const { pdfDrive } = await syncRowToDrive(saved);
          toast.success(
            pdfDrive.updated ? "PDF updated on Google Drive" : "PDF saved to Google Drive",
          );
        } catch (driveErr) {
          toast.error(
            driveErr instanceof ApiRequestError
              ? `Saved locally, but Drive sync failed: ${driveErr.message}`
              : "Saved locally, but Drive sync failed",
          );
        }
      }

      setOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this monthly donation file?")) return;
    try {
      await api(`/finance-files/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Delete failed");
    }
  }

  async function handleDownloadPdf(row: FinanceRecord) {
    setExportBusy(`pdf-${row._id}`);
    try {
      await downloadMonthlyDonationPdf(toExportInput(row));
      toast.success("PDF downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "PDF download failed");
    } finally {
      setExportBusy(null);
    }
  }

  async function handleSaveToDrive(row: FinanceRecord) {
    setDriveBusy(row._id);
    try {
      const { pdfDrive } = await syncRowToDrive(row);
      setRows((prev) =>
        prev.map((r) =>
          r._id === row._id
            ? {
                ...r,
                pdfDriveFileId: pdfDrive.driveFileId || r.pdfDriveFileId,
                pdfDriveWebViewLink: pdfDrive.driveWebViewLink || r.pdfDriveWebViewLink,
                pdfDrivePath: pdfDrive.drivePath || r.pdfDrivePath,
                pdfDriveUploadedAt: new Date().toISOString(),
              }
            : r,
        ),
      );
      toast.success(pdfDrive.updated ? "Drive PDF updated" : "PDF saved to Google Drive");
      if (pdfDrive.driveWebViewLink) {
        window.open(pdfDrive.driveWebViewLink, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Drive upload failed");
    } finally {
      setDriveBusy(null);
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Monthly Team Donation Files"
        description="Create monthly donation sheets (BOG → cabinet → directors → ADs → alumni), export PDF, and sync to Google Drive."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New monthly file
          </Button>
        }
      />

      {isScoped ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm text-amber-950">
          {isCabinet ? (
            <p>
              <strong>Cabinet view:</strong> You see all finance team submissions. Approve files before
              they sync to Google Drive or count as official records.
            </p>
          ) : (
            <p>
              <strong>Your submissions only.</strong> Add or edit your finance files here. Your cabinet
              member must approve before they appear in official documents or Drive exports.
            </p>
          )}
        </div>
      ) : null}

      {!isScoped ? (
        <div className="mb-4 flex flex-wrap items-end gap-3">
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
        </div>
      ) : null}

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
                <TableHead>Team</TableHead>
                {!isScoped ? <TableHead>Chapter</TableHead> : null}
                <TableHead>Approval</TableHead>
                <TableHead>Status</TableHead>
                {isCabinet && isScoped ? <TableHead>Submitted by</TableHead> : null}
                <TableHead className="text-right">Society total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isScoped ? (isCabinet ? 8 : 7) : 8} className="text-center text-muted-foreground">
                    No monthly donation files yet.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const f = (row.fields || {}) as unknown as MonthlyDonationFields & {
                    totals?: ReturnType<typeof calcDonationTotals>;
                  };
                  const totals = f.totals || calcDonationTotals(f);
                  const isOpen = expanded === row._id;
                  const onDrive = Boolean(row.pdfDriveFileId);
                  const locked =
                    row.approvalStatus === "approved" && !isCabinet && !canReview;
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
                        <TableCell>{f.teamName || "Finance"}</TableCell>
                        {!isScoped ? <TableCell>{chapterName(row.chapter)}</TableCell> : null}
                        <TableCell>
                          <ApprovalStatusBadge status={row.approvalStatus} />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1">
                            <Badge variant="secondary">{row.status || "draft"}</Badge>
                            {onDrive ? (
                              <Badge variant="outline" className="text-[10px]">
                                Drive
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        {isCabinet && isScoped ? (
                          <TableCell className="text-sm text-muted-foreground">
                            {row.createdBy?.name || "—"}
                          </TableCell>
                        ) : null}
                        <TableCell className="text-right font-medium">
                          {fmtPKR(totals.totalSocietyMembersDonation)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-0.5">
                            <SubmissionApprovalActions
                              approvalStatus={row.approvalStatus}
                              canReview={canReview}
                              busy={reviewBusy === row._id}
                              onApprove={() => void onReview(row._id, "approved")}
                              onReject={() => void onReview(row._id, "rejected")}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Download PDF"
                              disabled={exportBusy === `pdf-${row._id}`}
                              onClick={() => void handleDownloadPdf(row)}
                            >
                              {exportBusy === `pdf-${row._id}` ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <FileDown className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              title={onDrive ? "Update PDF on Google Drive" : "Save PDF to Google Drive"}
                              disabled={driveBusy === row._id || (locked && !isCabinet)}
                              onClick={() => void handleSaveToDrive(row)}
                            >
                              {driveBusy === row._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CloudUpload className="h-4 w-4" />
                              )}
                            </Button>
                            {row.pdfDriveWebViewLink ? (
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Open PDF on Drive"
                                onClick={() =>
                                  window.open(
                                    row.pdfDriveWebViewLink,
                                    "_blank",
                                    "noopener,noreferrer",
                                  )
                                }
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            ) : null}
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={locked}
                              onClick={() => openEdit(row)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={locked}
                              onClick={() => void onDelete(row._id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isOpen ? (
                        <TableRow>
                          <TableCell colSpan={isScoped ? 6 : 7} className="bg-muted/30 text-sm">
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                              <p>
                                BOG total:{" "}
                                <strong>{fmtPKR(totals.totalBogDonation)}</strong>
                              </p>
                              <p>
                                Cabinet total:{" "}
                                <strong>{fmtPKR(totals.totalCabinetDonation)}</strong>
                              </p>
                              <p>
                                Team total: <strong>{fmtPKR(totals.eachTeamTotal)}</strong>
                              </p>
                              <p>
                                Society members:{" "}
                                <strong>{fmtPKR(totals.totalSocietyMembersDonation)}</strong>
                              </p>
                            </div>
                            <p className="mt-2 text-muted-foreground">
                              BOG: {f.bogHeadName || "—"} · Cabinet members:{" "}
                              {(f.cabinetMembers || []).length} · Alumni:{" "}
                              {(f.alumni || []).length}
                            </p>
                            {row.pdfDrivePath ? (
                              <p className="mt-1 text-xs text-muted-foreground">
                                Drive: {row.pdfDrivePath}
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
              {editing ? "Edit monthly donation file" : "New monthly team donation file"}
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-5" onSubmit={(e) => void onSubmit(e)}>
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
              <div className="space-y-1.5">
                <Label>Team name</Label>
                <Input
                  value={fields.teamName}
                  onChange={(e) => setFields((p) => ({ ...p, teamName: e.target.value }))}
                  placeholder="Finance"
                />
              </div>
              {!isScoped ? (
                <div className="space-y-1.5">
                  <Label>Chapter</Label>
                  <Select value={chapter || "none"} onValueChange={(v) => setChapter(v === "none" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select chapter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {chapters.map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>

            {/* 1. BOG Head */}
            <div className="space-y-2 rounded-lg border border-border p-3">
              <p className="text-sm font-semibold">1. BOG Head of team — donation + SS</p>
              <div className="grid gap-2 sm:grid-cols-12">
                <Input
                  className="sm:col-span-5"
                  placeholder="BOG head name"
                  value={fields.bogHeadName}
                  onChange={(e) => setFields((p) => ({ ...p, bogHeadName: e.target.value }))}
                />
                <Input
                  className="sm:col-span-3"
                  type="number"
                  placeholder="Donation amount"
                  value={fields.bogHeadAmount === "" ? "" : fields.bogHeadAmount}
                  onChange={(e) =>
                    setFields((p) => ({
                      ...p,
                      bogHeadAmount: e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                />
                <div className="sm:col-span-4">
                  <SsUpload
                    attachmentKey={fields.bogHeadSsKey}
                    attachments={attachments}
                    setAttachments={setAttachments}
                    uploadMeta={formUploadMeta}
                  />
                </div>
              </div>
            </div>

            {/* 2–5. Cabinet + directors + ADs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">2–5. Cabinet members → Directors → ADs</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setFields((p) => ({
                      ...p,
                      cabinetMembers: [...p.cabinetMembers, emptyCabinetMember()],
                    }))
                  }
                >
                  <Plus className="h-3.5 w-3.5" /> Cabinet member
                </Button>
              </div>

              {fields.cabinetMembers.length === 0 ? (
                <p className="text-xs text-muted-foreground">No cabinet members yet.</p>
              ) : (
                fields.cabinetMembers.map((cab, cabIdx) => (
                  <div key={cab.id} className="space-y-3 rounded-lg border border-primary/20 bg-muted/20 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Cabinet member
                      </p>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          setFields((p) => ({
                            ...p,
                            cabinetMembers: p.cabinetMembers.filter((_, i) => i !== cabIdx),
                          }))
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-12">
                      <Input
                        className="sm:col-span-3"
                        placeholder="Role / team (e.g. Team Finance)"
                        value={cab.role || ""}
                        onChange={(e) => updateCabinet(cabIdx, { role: e.target.value })}
                      />
                      <Input
                        className="sm:col-span-4"
                        placeholder="Cabinet member name"
                        value={cab.name}
                        onChange={(e) => updateCabinet(cabIdx, { name: e.target.value })}
                      />
                      <Input
                        className="sm:col-span-2"
                        type="number"
                        placeholder="Amount"
                        value={cab.amount === "" ? "" : cab.amount}
                        onChange={(e) =>
                          updateCabinet(cabIdx, {
                            amount: e.target.value === "" ? "" : Number(e.target.value),
                          })
                        }
                      />
                      <div className="sm:col-span-3">
                        <SsUpload
                          attachmentKey={cab.ssKey}
                          attachments={attachments}
                          setAttachments={setAttachments}
                          uploadMeta={formUploadMeta}
                        />
                      </div>
                    </div>

                    <PersonRows
                      title="Directors (name, amount, SS)"
                      people={cab.directors}
                      onChange={(directors) => updateCabinet(cabIdx, { directors })}
                      attachments={attachments}
                      setAttachments={setAttachments}
                      uploadMeta={formUploadMeta}
                    />
                    <PersonRows
                      title="Assistant directors (amount + description)"
                      people={cab.assistantDirectors}
                      onChange={(assistantDirectors) =>
                        updateCabinet(cabIdx, { assistantDirectors })
                      }
                      attachments={attachments}
                      setAttachments={setAttachments}
                      showDescription
                      uploadMeta={formUploadMeta}
                    />
                  </div>
                ))
              )}
            </div>

            {/* 6. Alumni */}
            <PersonRows
              title="6. Alumni (name, donation, SS)"
              people={fields.alumni}
              onChange={(alumni) => setFields((p) => ({ ...p, alumni }))}
              attachments={attachments}
              setAttachments={setAttachments}
              uploadMeta={formUploadMeta}
            />

            {/* 7–10 Totals */}
            <div className="grid gap-2 rounded-lg border border-border bg-card p-3 text-sm sm:grid-cols-2">
              <p>
                7. Total cabinet members donation:{" "}
                <strong>{fmtPKR(liveTotals.totalCabinetDonation)}</strong>
              </p>
              <p>
                8. Total BOG members donation:{" "}
                <strong>{fmtPKR(liveTotals.totalBogDonation)}</strong>
              </p>
              <p>
                9. Each team total donation:{" "}
                <strong>{fmtPKR(liveTotals.eachTeamTotal)}</strong>
              </p>
              <p>
                10. Total in Finance Account:{" "}
                <strong>{fmtPKR(liveTotals.financeAccountTotal)}</strong>
              </p>
              <p>
                Grand Total: <strong>{fmtPKR(liveTotals.grandTotal)}</strong>
              </p>
            </div>

            <div className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Other account name (optional)</Label>
                <Input
                  placeholder="e.g. Nayyab bhai account"
                  value={fields.otherAccountName || ""}
                  onChange={(e) =>
                    setFields((p) => ({ ...p, otherAccountName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Other account amount</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={fields.otherAccountAmount === "" ? "" : fields.otherAccountAmount}
                  onChange={(e) =>
                    setFields((p) => ({
                      ...p,
                      otherAccountAmount:
                        e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-[200px]">
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
              <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={syncToDriveOnSave}
                  onChange={(e) => setSyncToDriveOnSave(e.target.checked)}
                />
                Also save / update PDF on Google Drive
              </label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editing ? "Save changes" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
