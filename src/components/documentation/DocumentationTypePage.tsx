import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Loader2, Plus, Pencil, Trash2, Upload, FileDown, CloudUpload, Check } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, PageShell } from "@/components/dashboard/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  DOC_FIELD_SCHEMAS,
  docTypeLabel,
  type DocType,
  type FieldDef,
} from "@/lib/documentation";
import { buildDocumentationPdf, downloadDocumentationPdf } from "@/lib/documentation-pdf";
import { useAuth } from "@/lib/auth";
import { canUploadDocumentationToDrive } from "@/lib/chapterRoles";
import type { ChapterScope } from "@/components/finance/FinanceDonationPage";

export interface DocAttachment {
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

export interface DocRecord {
  _id: string;
  type: DocType;
  title?: string;
  caseNumber?: string;
  chapter?: { _id: string; name: string; city?: string } | string | null;
  fields?: Record<string, unknown>;
  attachments?: DocAttachment[];
  notes?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: { name?: string };
  pdfDriveFileId?: string;
  pdfDriveWebViewLink?: string;
  pdfDrivePath?: string;
  pdfDriveUploadedAt?: string;
}

interface ChapterOption {
  _id: string;
  name: string;
  city?: string;
}

function getTokenHeader(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("sh_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function uploadFile(
  file: File,
  meta: {
    docType: string;
    chapterName?: string;
    caseNumber?: string;
    beneficiaryName?: string;
    attachmentKey?: string;
  },
): Promise<{
  url: string;
  publicId: string;
  name: string;
  driveFileId?: string;
  driveWebViewLink?: string;
  drivePath?: string;
  driveSynced?: boolean;
}> {
  const form = new FormData();
  form.append("file", file);
  form.append("docType", meta.docType || "");
  form.append("chapterName", meta.chapterName || "");
  form.append("caseNumber", meta.caseNumber || "");
  form.append("beneficiaryName", meta.beneficiaryName || "");
  form.append("attachmentKey", meta.attachmentKey || "");
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
  const res = await fetch(`${API_BASE}/documentation/upload`, {
    method: "POST",
    headers: getTokenHeader(),
    body: form,
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new ApiRequestError(data.message || "Upload failed", res.status);
  return data.data;
}

function chapterId(chapter: DocRecord["chapter"]): string {
  if (!chapter) return "";
  if (typeof chapter === "string") return chapter;
  return chapter._id;
}

function chapterName(chapter: DocRecord["chapter"]): string {
  if (!chapter) return "—";
  if (typeof chapter === "string") return chapter;
  return chapter.name;
}

type SchemaFormItem =
  | { kind: "field"; field: FieldDef }
  | { kind: "idCard"; groupId: string; title: string; front: FieldDef; back: FieldDef };

function groupSchemaFields(schema: FieldDef[]): SchemaFormItem[] {
  const items: SchemaFormItem[] = [];
  const seenGroups = new Set<string>();

  for (let i = 0; i < schema.length; i++) {
    const field = schema[i];
    if (field.idCardGroup) {
      if (seenGroups.has(field.idCardGroup)) continue;
      seenGroups.add(field.idCardGroup);
      const groupFields = schema.filter((f) => f.idCardGroup === field.idCardGroup);
      const front = groupFields.find((f) => f.idCardSide === "front") ?? groupFields[0];
      const back = groupFields.find((f) => f.idCardSide === "back") ?? groupFields[1] ?? groupFields[0];
      items.push({
        kind: "idCard",
        groupId: field.idCardGroup,
        title: field.idCardTitle ?? field.label,
        front,
        back,
      });
      continue;
    }
    items.push({ kind: "field", field });
  }
  return items;
}

export function DocumentationTypePage({
  type,
  description,
  scope,
}: {
  type: DocType;
  description: string;
  scope?: ChapterScope;
}) {
  const schema = DOC_FIELD_SCHEMAS[type];
  const { user } = useAuth();
  const isScoped = Boolean(scope);
  const canDriveUpload = canUploadDocumentationToDrive(user);
  const [rows, setRows] = useState<DocRecord[]>([]);
  const [chapters, setChapters] = useState<ChapterOption[]>([]);
  const [chapterFilter, setChapterFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DocRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [pdfBusy, setPdfBusy] = useState<string | null>(null);
  const [driveBusy, setDriveBusy] = useState<string | null>(null);

  const [chapter, setChapter] = useState("");
  const [status, setStatus] = useState("draft");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<DocAttachment[]>([]);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  function buildFieldsFromForm(): Record<string, unknown> {
    const fields: Record<string, unknown> = {};
    for (const f of schema) {
      if (f.kind === "files") continue;
      if (f.key === "caseNumber" || f.key === "notes") continue;
      const raw = fieldValues[f.key] ?? "";
      if (f.kind === "number") {
        fields[f.key] = raw === "" ? null : Number(raw);
      } else {
        fields[f.key] = raw;
      }
    }
    return fields;
  }

  async function uploadPdfToDrive(
    blob: Blob,
    filename: string,
    meta: {
      chapterName?: string;
      caseNumber?: string;
      beneficiaryName?: string;
      docId?: string;
    },
  ) {
    const form = new FormData();
    form.append("file", new File([blob], filename, { type: "application/pdf" }));
    form.append("docType", type);
    form.append("chapterName", meta.chapterName || "");
    form.append("caseNumber", meta.caseNumber || "");
    form.append("beneficiaryName", meta.beneficiaryName || "");
    if (meta.docId) form.append("docId", meta.docId);
    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
    const res = await fetch(`${API_BASE}/documentation/upload-pdf`, {
      method: "POST",
      headers: getTokenHeader(),
      body: form,
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new ApiRequestError(data.message || "Drive PDF upload failed", res.status);
    return data.data as {
      alreadyUploaded?: boolean;
      driveSynced?: boolean;
      drivePath?: string;
      driveWebViewLink?: string;
      driveFileId?: string;
    };
  }

  async function handleDownloadPdf(source: "row" | "form", row?: DocRecord) {
    const busyKey = source === "row" ? row?._id ?? "row" : "form";
    setPdfBusy(busyKey);
    try {
      if (source === "row" && row) {
        await downloadDocumentationPdf({
          type,
          title: row.title,
          caseNumber: row.caseNumber,
          chapterName: chapterName(row.chapter),
          status: row.status,
          fields: row.fields ?? {},
          attachments: row.attachments ?? [],
          notes: row.notes,
          generatedBy: user?.name,
        });
      } else {
        const chapterMeta = scope
          ? { name: scope.chapterName }
          : chapters.find((c) => c._id === chapter);
        await downloadDocumentationPdf({
          type,
          title: fieldValues.caseNumber || undefined,
          caseNumber: fieldValues.caseNumber || undefined,
          chapterName: chapterMeta?.name,
          status,
          fields: buildFieldsFromForm(),
          attachments,
          notes: fieldValues.notes,
          generatedBy: user?.name,
        });
      }
      toast.success("PDF downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "PDF download failed");
    } finally {
      setPdfBusy(null);
    }
  }

  async function handleUploadPdfToDrive(row: DocRecord) {
    if (row.pdfDriveFileId) {
      toast.message("Already on Google Drive");
      if (row.pdfDriveWebViewLink) {
        window.open(row.pdfDriveWebViewLink, "_blank", "noopener,noreferrer");
      }
      return;
    }

    setDriveBusy(row._id);
    try {
      const fields = (row.fields ?? {}) as Record<string, unknown>;
      const { blob, filename } = await buildDocumentationPdf({
        type,
        title: row.title,
        caseNumber: row.caseNumber,
        chapterName: chapterName(row.chapter),
        status: row.status,
        fields: row.fields ?? {},
        attachments: row.attachments ?? [],
        notes: row.notes,
        generatedBy: user?.name,
      });

      const drive = await uploadPdfToDrive(blob, filename, {
        chapterName: chapterName(row.chapter) === "—" ? "" : chapterName(row.chapter),
        caseNumber: row.caseNumber || "",
        beneficiaryName: typeof fields.beneficiaryName === "string" ? fields.beneficiaryName : "",
        docId: row._id,
      });

      if (!drive?.driveSynced && !drive?.alreadyUploaded) {
        toast.error("Drive upload failed");
        return;
      }

      setRows((prev) =>
        prev.map((r) =>
          r._id === row._id
            ? {
                ...r,
                pdfDriveFileId: drive.driveFileId || r.pdfDriveFileId,
                pdfDriveWebViewLink: drive.driveWebViewLink || r.pdfDriveWebViewLink,
                pdfDrivePath: drive.drivePath || r.pdfDrivePath,
                pdfDriveUploadedAt: new Date().toISOString(),
              }
            : r,
        ),
      );

      toast.success(drive.alreadyUploaded ? "Already on Google Drive" : "PDF uploaded to Google Drive");
      if (drive.driveWebViewLink) {
        window.open(drive.driveWebViewLink, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Drive upload failed");
    } finally {
      setDriveBusy(null);
    }
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ type, limit: "100" });
      if (scope) {
        qs.set("chapter", scope.chapterId);
      } else if (chapterFilter !== "all") {
        qs.set("chapter", chapterFilter);
      }
      if (scope) {
        const docsRes = await api<{ success: true; data: DocRecord[] }>(
          `/documentation?${qs.toString()}`,
        );
        setRows(docsRes.data);
      } else {
        const [docsRes, chaptersRes] = await Promise.all([
          api<{ success: true; data: DocRecord[] }>(`/documentation?${qs.toString()}`),
          api<{ success: true; data: ChapterOption[] }>("/chapters"),
        ]);
        setRows(docsRes.data);
        setChapters(chaptersRes.data);
      }
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [type, chapterFilter, scope]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm(doc?: DocRecord | null) {
    const fields = (doc?.fields ?? {}) as Record<string, unknown>;
    const next: Record<string, string> = {};
    for (const f of schema) {
      if (f.kind === "files") continue;
      if (f.key === "caseNumber") {
        next.caseNumber = doc?.caseNumber ?? "";
        continue;
      }
      if (f.key === "notes") {
        next.notes = doc?.notes ?? String(fields.notes ?? "");
        continue;
      }
      const v = fields[f.key];
      next[f.key] = v == null ? "" : String(v);
    }
    setFieldValues(next);
    setAttachments(doc?.attachments ?? []);
    setChapter(scope ? scope.chapterId : chapterId(doc?.chapter ?? null));
    setStatus(doc?.status ?? "draft");
  }

  function openCreate() {
    setEditing(null);
    resetForm(null);
    if (scope) setChapter(scope.chapterId);
    setOpen(true);
  }

  function openEdit(doc: DocRecord) {
    setEditing(doc);
    resetForm(doc);
    setOpen(true);
  }

  async function onUpload(field: FieldDef, files: FileList | null) {
    if (!files?.length || !field.attachmentKey) return;
    setUploadingKey(field.attachmentKey);
    try {
      const chapterMetaName =
        scope?.chapterName ?? chapters.find((c) => c._id === chapter)?.name ?? "";
      const uploaded: DocAttachment[] = [];
      for (const file of Array.from(files)) {
        const result = await uploadFile(file, {
          docType: type,
          chapterName: chapterMetaName,
          caseNumber: fieldValues.caseNumber || "",
          beneficiaryName: fieldValues.beneficiaryName || "",
          attachmentKey: field.attachmentKey,
        });
        uploaded.push({
          key: field.attachmentKey,
          name: result.name,
          url: result.url,
          publicId: result.publicId,
          note: "",
          driveFileId: result.driveFileId || "",
          driveWebViewLink: result.driveWebViewLink || "",
          drivePath: result.drivePath || "",
        });
      }
      setAttachments((prev) => [...prev, ...uploaded]);
      const synced = uploaded.filter((u) => u.driveFileId).length;
      toast.success(
        synced
          ? `${uploaded.length} file(s) uploaded (Cloudinary + Google Drive)`
          : `${uploaded.length} file(s) uploaded`,
      );
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Upload failed");
    } finally {
      setUploadingKey(null);
    }
  }

  function removeAttachment(idx: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const fields: Record<string, unknown> = {};
      let caseNumber = "";
      let notes = "";

      for (const f of schema) {
        if (f.kind === "files") continue;
        const raw = fieldValues[f.key] ?? "";
        if (f.key === "caseNumber") {
          caseNumber = raw;
          continue;
        }
        if (f.key === "notes") {
          notes = raw;
          continue;
        }
        if (f.kind === "number") {
          fields[f.key] = raw === "" ? null : Number(raw);
        } else {
          fields[f.key] = raw;
        }
      }

      // Also put ration/reference primary ids into caseNumber when useful
      if (!caseNumber) {
        caseNumber =
          String(fields.rationCaseNumber ?? fields.referenceNumber ?? fields.driveName ?? fields.periodLabel ?? "") ||
          "";
      }

      const title =
        caseNumber ||
        String(fields.driveName ?? fields.referenceNumber ?? fields.periodLabel ?? docTypeLabel(type));

      const body = {
        type,
        title,
        caseNumber,
        chapter: chapter || null,
        fields,
        attachments,
        notes,
        status,
      };

      if (editing) {
        await api(`/documentation/${editing._id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("Document updated");
      } else {
        await api("/documentation", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Document created");
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
    if (!confirm("Delete this document?")) return;
    try {
      await api(`/documentation/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Delete failed");
    }
  }

  const attachmentsByKey = useMemo(() => {
    const map: Record<string, DocAttachment[]> = {};
    for (const a of attachments) {
      (map[a.key] ??= []).push(a);
    }
    return map;
  }, [attachments]);

  return (
    <PageShell>
      <PageHeader
        title={docTypeLabel(type)}
        description={description}
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> New file
          </Button>
        }
      />

      {!isScoped ? (
        <div className="flex flex-wrap items-center gap-3">
          <Label className="text-xs text-muted-foreground">Chapter</Label>
          <Select value={chapterFilter} onValueChange={setChapterFilter}>
            <SelectTrigger className="w-[220px]">
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

      <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Identifier</TableHead>
                {!isScoped ? <TableHead>Chapter</TableHead> : null}
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r._id}>
                  <TableCell className="font-medium">
                    {r.caseNumber || r.title || "Untitled"}
                  </TableCell>
                  {!isScoped ? <TableCell>{chapterName(r.chapter)}</TableCell> : null}
                  <TableCell>
                    <Badge variant="secondary">{r.status ?? "draft"}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.createdBy?.name ?? "—"}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      title="Download PDF"
                      disabled={pdfBusy === r._id}
                      onClick={() => void handleDownloadPdf("row", r)}
                    >
                      {pdfBusy === r._id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FileDown className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    {canDriveUpload ? (
                      r.pdfDriveFileId ? (
                        <Button
                          size="sm"
                          variant="outline"
                          title="On Google Drive — open"
                          className="border-emerald-600/40 text-emerald-700"
                          onClick={() => {
                            if (r.pdfDriveWebViewLink) {
                              window.open(r.pdfDriveWebViewLink, "_blank", "noopener,noreferrer");
                            } else {
                              toast.message("Already uploaded to Google Drive");
                            }
                          }}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          title="Upload PDF to Google Drive"
                          disabled={driveBusy === r._id}
                          onClick={() => void handleUploadPdfToDrive(r)}
                        >
                          {driveBusy === r._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CloudUpload className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )
                    ) : null}
                    <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
                      <Pencil className="h-3.5 w-3.5" />
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
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isScoped ? 5 : 6} className="py-10 text-center text-muted-foreground">
                    No documents yet. Create the first file.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit" : "Create"} {docTypeLabel(type)}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {!isScoped ? (
                <div className="space-y-2">
                  <Label>Chapter</Label>
                  <Select value={chapter || "none"} onValueChange={(v) => setChapter(v === "none" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select chapter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {chapters.map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <div className="space-y-2">
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

            {groupSchemaFields(schema).map((item) => {
              if (item.kind === "idCard") {
                const { front, back, title } = item;
                return (
                  <div
                    key={item.groupId}
                    className="space-y-3 rounded-lg border border-border bg-muted/20 p-3"
                  >
                    <Label className="text-sm font-medium">{title}</Label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[front, back].map((side) => (
                        <FieldInput
                          key={side.key}
                          field={{ ...side, label: side.idCardSide === "front" ? "Front" : "Back" }}
                          value={fieldValues[side.key] ?? ""}
                          onChange={(v) => setFieldValues((prev) => ({ ...prev, [side.key]: v }))}
                          files={side.attachmentKey ? attachmentsByKey[side.attachmentKey] ?? [] : []}
                          uploading={uploadingKey === side.attachmentKey}
                          onUpload={(files) => void onUpload(side, files)}
                          onRemoveFile={(globalIdx) => {
                            let seen = -1;
                            const idx = attachments.findIndex((a) => {
                              if (a.key !== side.attachmentKey) return false;
                              seen += 1;
                              return seen === globalIdx;
                            });
                            if (idx >= 0) removeAttachment(idx);
                          }}
                          onFileNote={(globalIdx, note) => {
                            let seen = -1;
                            const idx = attachments.findIndex((a) => {
                              if (a.key !== side.attachmentKey) return false;
                              seen += 1;
                              return seen === globalIdx;
                            });
                            if (idx < 0) return;
                            setAttachments((prev) =>
                              prev.map((a, i) => (i === idx ? { ...a, note } : a)),
                            );
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              }

              const field = item.field;
              return (
                <FieldInput
                  key={field.key}
                  field={field}
                  value={fieldValues[field.key] ?? ""}
                  onChange={(v) => setFieldValues((prev) => ({ ...prev, [field.key]: v }))}
                  files={field.attachmentKey ? attachmentsByKey[field.attachmentKey] ?? [] : []}
                  uploading={uploadingKey === field.attachmentKey}
                  onUpload={(files) => void onUpload(field, files)}
                  onRemoveFile={(globalIdx) => {
                    let seen = -1;
                    const idx = attachments.findIndex((a) => {
                      if (a.key !== field.attachmentKey) return false;
                      seen += 1;
                      return seen === globalIdx;
                    });
                    if (idx >= 0) removeAttachment(idx);
                  }}
                  onFileNote={(globalIdx, note) => {
                    let seen = -1;
                    const idx = attachments.findIndex((a) => {
                      if (a.key !== field.attachmentKey) return false;
                      seen += 1;
                      return seen === globalIdx;
                    });
                    if (idx < 0) return;
                    setAttachments((prev) =>
                      prev.map((a, i) => (i === idx ? { ...a, note } : a)),
                    );
                  }}
                />
              );
            })}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={pdfBusy === "form"}
                onClick={() => void handleDownloadPdf("form")}
              >
                {pdfBusy === "form" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing PDF…
                  </>
                ) : (
                  <>
                    <FileDown className="mr-2 h-4 w-4" /> Download PDF
                  </>
                )}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  files,
  uploading,
  onUpload,
  onRemoveFile,
  onFileNote,
}: {
  field: FieldDef;
  value: string;
  onChange: (v: string) => void;
  files: DocAttachment[];
  uploading: boolean;
  onUpload: (files: FileList | null) => void;
  onRemoveFile: (idxInKeyGroup: number) => void;
  onFileNote?: (idxInKeyGroup: number, note: string) => void;
}): ReactNode {
  if (field.kind === "files") {
    const allowMultiple = field.multiple !== false && !field.idCardSide;
    return (
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <Label>{field.label}</Label>
          {allowMultiple && (
            <span className="text-[11px] text-muted-foreground">Multiple images allowed</span>
          )}
        </div>
        <div className="rounded-lg border border-dashed border-border p-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-primary">
            <Upload className="h-4 w-4" />
            {uploading
              ? "Uploading…"
              : allowMultiple
                ? files.length
                  ? "Add more images"
                  : "Upload images (select multiple)"
                : files.length
                  ? "Replace / upload"
                  : "Upload file"}
            <input
              type="file"
              className="hidden"
              multiple={allowMultiple}
              accept="image/*,application/pdf"
              disabled={uploading}
              onChange={(e) => {
                onUpload(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
          {allowMultiple && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Hold Ctrl (Windows) / Cmd (Mac) to select several files at once.
            </p>
          )}
          {files.length > 0 && (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {files.map((f, i) => (
                <li
                  key={`${f.publicId ?? f.url}-${i}`}
                  className="space-y-1.5 rounded-md bg-muted/40 px-2 py-2 text-xs"
                >
                  <div className="flex items-start gap-2">
                    {f.url && /\.(png|jpe?g|jfif|webp|gif)(\?|$)/i.test(f.url) ? (
                      <a href={f.url} target="_blank" rel="noreferrer" className="shrink-0">
                        <img
                          src={f.url}
                          alt={f.name || "upload"}
                          className="h-14 w-14 rounded object-cover border border-border"
                        />
                      </a>
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate underline"
                      >
                        {f.name || f.url}
                      </a>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="mt-1 h-7 px-2"
                        onClick={() => onRemoveFile(i)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                  {field.allowFileNote && onFileNote && (
                    <Input
                      className="h-8 text-xs"
                      placeholder="Note / description for this file…"
                      value={f.note ?? ""}
                      onChange={(e) => onFileNote(i, e.target.value)}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  if (field.kind === "textarea") {
    return (
      <div className="space-y-2">
        <Label>{field.label}</Label>
        <Textarea
          required={field.required}
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      </div>
    );
  }

  if (field.kind === "select") {
    return (
      <div className="space-y-2">
        <Label>{field.label}</Label>
        <Select value={value || undefined} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>{field.label}</Label>
      <Input
        type={field.kind === "number" ? "number" : field.kind === "date" ? "date" : "text"}
        required={field.required}
        value={value}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
