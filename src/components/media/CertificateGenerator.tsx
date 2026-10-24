import { useEffect, useRef, useState, type ChangeEvent } from "react";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { Award, Loader2 } from "lucide-react";

import { PageHeader, PageShell } from "@/components/dashboard/page-shell";
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

const AVAILABLE_FONTS = [
  "Poppins",
  "Roboto",
  "Montserrat",
  "Merriweather",
  "Playfair Display",
  "Pacifico",
  "Lobster",
  "Arial",
  "Times New Roman",
  "Courier New",
  "Great Vibes",
  "Dancing Script",
  "Satisfy",
  "Allura",
  "Alex Brush",
  "Noto Naskh Arabic",
  "Noto Nastaliq Urdu",
];

type Row = Record<string, unknown>;

type TextStyle = {
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontColor: string;
};

function readImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = String(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readWorkbook(file: File): Promise<Row[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = new Uint8Array(reader.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        resolve(XLSX.utils.sheet_to_json(sheet, { defval: "" }) as Row[]);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function pickCell(row: Row, column: string): string {
  if (!column) return "";
  const raw = row[column] ?? row[column.toLowerCase()] ?? row[column.toUpperCase()];
  return String(raw ?? "").trim();
}

function detectColumn(headers: string[], patterns: RegExp[], fallback = ""): string {
  for (const re of patterns) {
    const hit = headers.find((h) => re.test(h));
    if (hit) return hit;
  }
  return fallback;
}

function drawStyledText(ctx: CanvasRenderingContext2D, text: string, style: TextStyle) {
  if (!text) return;
  ctx.fillStyle = style.fontColor;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.font = `${style.fontSize}px "${style.fontFamily}"`;
  ctx.lineWidth = Math.max(2, Math.floor(style.fontSize / 12));
  ctx.strokeStyle = "#ffffff";
  ctx.strokeText(text, style.x, style.y);
  ctx.fillText(text, style.x, style.y);
}

function ColumnSelect({
  label,
  value,
  onChange,
  columns,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  columns: string[];
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {columns.length > 0 ? (
        <Select value={value || undefined} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {columns.map((col) => (
              <SelectItem key={col} value={col}>
                {col}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
}

function PositionFontControls({
  title,
  style,
  onChange,
}: {
  title: string;
  style: TextStyle;
  onChange: (next: TextStyle) => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-sm font-semibold">{title}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Position X</Label>
          <Input
            type="number"
            value={style.x}
            onChange={(e) => onChange({ ...style, x: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Position Y</Label>
          <Input
            type="number"
            value={style.y}
            onChange={(e) => onChange({ ...style, y: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Font size</Label>
          <Input
            type="number"
            min={8}
            value={style.fontSize}
            onChange={(e) => onChange({ ...style, fontSize: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Font color</Label>
          <Input
            type="color"
            className="h-10 p-1"
            value={style.fontColor}
            onChange={(e) => onChange({ ...style, fontColor: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Font family</Label>
        <Select
          value={style.fontFamily}
          onValueChange={(fontFamily) => onChange({ ...style, fontFamily })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_FONTS.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function CertificateGenerator() {
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [nameColumn, setNameColumn] = useState("Name");
  const [refColumn, setRefColumn] = useState("Reference No");
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Row[]>([]);
  const [namesFoundCount, setNamesFoundCount] = useState(0);
  const [refsFoundCount, setRefsFoundCount] = useState(0);
  const [previewHint, setPreviewHint] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [templatePreviewImg, setTemplatePreviewImg] = useState<HTMLImageElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [nameStyle, setNameStyle] = useState<TextStyle>({
    x: 600,
    y: 400,
    fontSize: 48,
    fontFamily: "Poppins",
    fontColor: "#000000",
  });
  const [refStyle, setRefStyle] = useState<TextStyle>({
    x: 600,
    y: 480,
    fontSize: 28,
    fontFamily: "Poppins",
    fontColor: "#333333",
  });

  function handleTemplateChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setTemplateFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        setTemplatePreviewImg(img);
        const cx = Math.floor(img.width / 2);
        setNameStyle((s) => ({ ...s, x: cx, y: Math.floor(img.height * 0.55) }));
        setRefStyle((s) => ({ ...s, x: cx, y: Math.floor(img.height * 0.68) }));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function handleExcelChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFile(file);
    try {
      const rows = await readWorkbook(file);
      setParsedRows(rows);
      const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
      setAvailableColumns(headers);

      const detectedName =
        detectColumn(headers, [/^name$/i, /full\s*name/i, /recipient/i, /name/i], headers[0] || "Name");
      const detectedRef = detectColumn(
        headers,
        [/ref(erence)?(\s*(no|num|number|#))?/i, /ref\s*no/i, /certificate\s*(no|id)/i, /^id$/i],
        headers.find((h) => h !== detectedName) || "Reference No",
      );

      setNameColumn(detectedName);
      setRefColumn(detectedRef);

      const names = rows.map((r) => pickCell(r, detectedName)).filter(Boolean);
      const refs = rows.map((r) => pickCell(r, detectedRef)).filter(Boolean);
      setNamesFoundCount(names.length);
      setRefsFoundCount(refs.length);
      setPreviewHint(
        names[0]
          ? `Preview: ${names[0]}${refs[0] ? ` · Ref ${refs[0]}` : ""}`
          : "",
      );
    } catch (err) {
      console.error(err);
      setParsedRows([]);
      setAvailableColumns([]);
      setNamesFoundCount(0);
      setRefsFoundCount(0);
      setPreviewHint("");
      toast.error("Could not read Excel file");
    }
  }

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !templatePreviewImg) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      canvas.width = templatePreviewImg.width;
      canvas.height = templatePreviewImg.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(templatePreviewImg, 0, 0, canvas.width, canvas.height);

      const first = parsedRows.find(
        (r) => pickCell(r, nameColumn) || pickCell(r, refColumn),
      );
      if (!first) return;
      drawStyledText(ctx, pickCell(first, nameColumn), nameStyle);
      drawStyledText(ctx, pickCell(first, refColumn), refStyle);
    };

    const loads: Promise<unknown>[] = [];
    if (document.fonts?.load) {
      loads.push(document.fonts.load(`${nameStyle.fontSize}px "${nameStyle.fontFamily}"`));
      loads.push(document.fonts.load(`${refStyle.fontSize}px "${refStyle.fontFamily}"`));
    }
    if (loads.length) {
      void Promise.all(loads).then(draw).catch(draw);
      return;
    }
    draw();
  }, [
    templatePreviewImg,
    parsedRows,
    nameColumn,
    refColumn,
    nameStyle,
    refStyle,
  ]);

  async function generateCertificates() {
    if (!templateFile || !excelFile) {
      toast.error("Please select both a template image and an Excel file.");
      return;
    }
    if (!nameColumn) {
      toast.error("Select the Name column from Excel.");
      return;
    }
    setIsGenerating(true);
    try {
      const [templateImage, rows] = await Promise.all([
        readImage(templateFile),
        parsedRows.length ? Promise.resolve(parsedRows) : readWorkbook(excelFile),
      ]);

      if (document.fonts?.load) {
        await Promise.all([
          document.fonts.load(`${nameStyle.fontSize}px "${nameStyle.fontFamily}"`).catch(() => undefined),
          document.fonts.load(`${refStyle.fontSize}px "${refStyle.fontFamily}"`).catch(() => undefined),
        ]);
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      canvas.width = templateImage.width;
      canvas.height = templateImage.height;

      const zip = new JSZip();
      let filesAdded = 0;

      for (const row of rows) {
        const recipientName = pickCell(row, nameColumn);
        const refNo = pickCell(row, refColumn);
        if (!recipientName && !refNo) continue;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);
        drawStyledText(ctx, recipientName, nameStyle);
        drawStyledText(ctx, refNo, refStyle);

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/png", 1),
        );
        if (!blob) continue;

        const base =
          [recipientName, refNo].filter(Boolean).join("_") || `certificate_${filesAdded + 1}`;
        const fileNameSafe = base.replace(/[^a-z0-9\-_. ]/gi, "_");
        zip.file(`${fileNameSafe}.png`, await blob.arrayBuffer());
        filesAdded += 1;
      }

      if (filesAdded === 0) {
        toast.error("No names or reference numbers found. Check Excel columns.");
        return;
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, "certificates.zip");
      toast.success(`Generated ${filesAdded} certificate(s)`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate certificates. Check your files and settings.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <PageShell>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Roboto:wght@400;700&family=Montserrat:wght@400;700&family=Merriweather:wght@400;700&family=Playfair+Display:wght@400;700&family=Pacifico&family=Lobster&family=Great+Vibes&family=Dancing+Script:wght@400;700&family=Satisfy&family=Allura&family=Alex+Brush&family=Noto+Naskh+Arabic:wght@400;700&family=Noto+Nastaliq+Urdu:wght@400;700&display=swap"
      />
      <PageHeader
        title="Certificate Generator"
        description="Place Name and Reference No from Excel on your template, then download a ZIP."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="space-y-2">
            <Label>Certificate template (PNG / JPG)</Label>
            <Input type="file" accept="image/png,image/jpeg" onChange={handleTemplateChange} />
          </div>

          <div className="space-y-2">
            <Label>Excel sheet (.xlsx / .xls)</Label>
            <Input type="file" accept=".xlsx,.xls" onChange={handleExcelChange} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ColumnSelect
              label="Name column"
              value={nameColumn}
              onChange={setNameColumn}
              columns={availableColumns}
              placeholder="e.g. Name"
            />
            <ColumnSelect
              label="Reference No column"
              value={refColumn}
              onChange={setRefColumn}
              columns={availableColumns}
              placeholder="e.g. Reference No"
            />
          </div>

          {(namesFoundCount > 0 || refsFoundCount > 0) && (
            <p className="text-xs text-muted-foreground">
              Found {namesFoundCount} name(s) and {refsFoundCount} reference(s).
              {previewHint ? ` ${previewHint}` : ""}
            </p>
          )}

          <PositionFontControls title="Name placement" style={nameStyle} onChange={setNameStyle} />
          <PositionFontControls
            title="Reference No placement"
            style={refStyle}
            onChange={setRefStyle}
          />

          <Button onClick={() => void generateCertificates()} disabled={isGenerating} className="w-full">
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…
              </>
            ) : (
              <>
                <Award className="mr-2 h-4 w-4" /> Generate ZIP
              </>
            )}
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <p className="mb-3 text-sm font-semibold">Live preview</p>
          {templatePreviewImg ? (
            <div className="max-h-[70vh] overflow-auto rounded-lg border border-border">
              <canvas ref={previewCanvasRef} className="h-auto w-full" />
            </div>
          ) : (
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Upload a template to see a live preview.</li>
              <li>Excel should have Name and Reference No columns.</li>
              <li>Adjust X/Y and font for name and reference separately.</li>
            </ul>
          )}
        </div>
      </div>
    </PageShell>
  );
}
