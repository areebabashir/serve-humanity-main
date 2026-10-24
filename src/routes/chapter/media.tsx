import { CertificateGenerator } from "@/components/media/CertificateGenerator";
import { MediaTemplatesPage } from "@/components/media/MediaTemplatesPage";
import { ChapterCard } from "@/components/chapter/ChapterPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useChapterRole } from "@/components/chapter/ChapterGuard";
import { canWriteChapterModule } from "@/lib/chapterRoles";
import { api, ApiRequestError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MediaRow = {
  _id: string;
  title: string;
  type?: string;
  url: string;
  thumbnail?: string;
  status?: string;
};

function ChapterGallery() {
  const role = useChapterRole();
  const canWrite = canWriteChapterModule(role, "media");
  const [rows, setRows] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ success: true; data: MediaRow[] }>("/media?limit=40");
      setRows(res.data || []);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load media");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onUpload(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Choose a file");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title || file.name);
      fd.append("type", "Graphic");
      await api("/media/upload", { method: "POST", body: fd });
      toast.success("Uploaded");
      setTitle("");
      setFile(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {canWrite ? (
        <ChapterCard className="mb-5">
          <form onSubmit={onUpload} className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Optional title" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">File</Label>
              <Input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload
              </Button>
            </div>
          </form>
        </ChapterCard>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading…
        </p>
      ) : rows.length === 0 ? (
        <ChapterCard>
          <p className="text-sm text-muted-foreground">No media uploaded for this chapter yet.</p>
        </ChapterCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((m) => (
            <a
              key={m._id}
              href={m.url}
              target="_blank"
              rel="noreferrer"
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:-translate-y-0.5"
            >
              <div className="aspect-video bg-secondary">
                {m.thumbnail || m.url ? (
                  <img
                    src={m.thumbnail || m.url}
                    alt={m.title}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-semibold">{m.title}</p>
                <p className="text-xs text-muted-foreground">
                  {m.type || "Media"} · {m.status || "Pending"}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChapterMediaPage() {
  return (
    <Tabs defaultValue="gallery" className="gap-6">
      <TabsList>
        <TabsTrigger value="gallery">Chapter gallery</TabsTrigger>
        <TabsTrigger value="templates">Templates</TabsTrigger>
        <TabsTrigger value="certificate">Certificate generator</TabsTrigger>
      </TabsList>
      <TabsContent value="gallery">
        <ChapterGallery />
      </TabsContent>
      <TabsContent value="templates">
        <MediaTemplatesPage canManage={false} />
      </TabsContent>
      <TabsContent value="certificate">
        <CertificateGenerator />
      </TabsContent>
    </Tabs>
  );
}
