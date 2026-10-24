import { useCallback, useEffect, useRef, useState } from "react";
import {
  Download,
  ImagePlus,
  LayoutTemplate,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader, PageShell } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, ApiRequestError } from "@/lib/api";

const CATEGORIES = ["Poster", "Social", "Certificate", "Banner", "Other"] as const;

type TemplateCategory = (typeof CATEGORIES)[number];

interface MediaTemplate {
  _id: string;
  title: string;
  category: TemplateCategory;
  url: string;
  thumbnail?: string;
  description?: string;
  createdAt?: string;
  uploadedBy?: { name?: string } | null;
}

export function MediaTemplatesPage({ canManage = true }: { canManage?: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<MediaTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("Poster");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = filter !== "all" ? `?category=${encodeURIComponent(filter)}` : "";
      const res = await api<{ success: true; data: MediaTemplate[] }>(`/media-templates${q}`);
      setItems(res.data || []);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onUpload() {
    if (!file) {
      toast.error("Choose a template image or PDF first");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("title", title.trim() || file.name);
      form.append("category", category);
      form.append("description", description.trim());
      await api("/media-templates/upload", { method: "POST", body: form });
      toast.success("Template uploaded");
      setTitle("");
      setDescription("");
      setFile(null);
      setCategory("Poster");
      if (fileRef.current) fileRef.current.value = "";
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function onDelete(id: string, name: string) {
    if (!confirm(`Delete template “${name}”?`)) return;
    try {
      await api(`/media-templates/${id}`, { method: "DELETE" });
      toast.success("Template deleted");
      setItems((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Delete failed");
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Templates"
        description="All poster and graphic templates in one place. Upload, browse, and download."
      />

      {canManage ? (
        <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] md:p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Upload className="h-4 w-4" />
            Upload template
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input
                placeholder="e.g. Ramadan poster"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as TemplateCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">File (image or PDF)</Label>
              <Input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <Label className="text-xs">Description (optional)</Label>
              <Textarea
                className="min-h-[72px]"
                placeholder="Where this template is used…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full" disabled={uploading || !file} onClick={() => void onUpload()}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                Upload
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading…" : `${items.length} template${items.length === 1 ? "" : "s"}`}
        </p>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading templates…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
          <LayoutTemplate className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <p className="mt-3 text-sm font-medium">No templates yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {canManage
              ? "Upload your first poster template above."
              : "Organization templates will appear here when available."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((t) => {
            const isPdf = /\.pdf($|\?)/i.test(t.url) || t.url.includes("/raw/");
            return (
              <div
                key={t._id}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]"
              >
                <div className="relative aspect-[4/5] bg-muted/40">
                  {isPdf ? (
                    <div className="grid h-full place-items-center text-sm text-muted-foreground">
                      PDF template
                    </div>
                  ) : (
                    <img src={t.thumbnail || t.url} alt={t.title} className="h-full w-full object-cover" />
                  )}
                  <Badge className="absolute left-2 top-2" variant="secondary">
                    {t.category}
                  </Badge>
                </div>
                <div className="space-y-2 p-3">
                  <p className="line-clamp-2 text-sm font-medium leading-snug">{t.title}</p>
                  {t.description ? (
                    <p className="line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
                  ) : null}
                  <p className="text-[10px] text-muted-foreground">
                    {t.uploadedBy?.name ? `${t.uploadedBy.name} · ` : ""}
                    {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : ""}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" asChild>
                      <a href={t.url} target="_blank" rel="noreferrer" download>
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                    </Button>
                    {canManage ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => void onDelete(t._id, t.title)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
