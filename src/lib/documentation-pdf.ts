import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import {
  DOC_FIELD_SCHEMAS,
  docTypeLabel,
  type DocType,
  type FieldDef,
} from "@/lib/documentation";

export interface PdfAttachment {
  key: string;
  name?: string;
  url?: string;
  note?: string;
}

export interface DocumentationPdfInput {
  type: DocType;
  title?: string;
  caseNumber?: string;
  chapterName?: string;
  status?: string;
  fields?: Record<string, unknown>;
  attachments?: PdfAttachment[];
  notes?: string;
  generatedBy?: string;
}

const MARGIN = 16;
const INK = {
  text: [28, 28, 28] as [number, number, number],
  soft: [90, 90, 90] as [number, number, number],
  line: [180, 180, 180] as [number, number, number],
  softLine: [220, 220, 220] as [number, number, number],
  headerBg: [245, 245, 245] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

type LoadedImage = {
  dataUrl: string;
  format: "PNG" | "JPEG";
};

async function loadImageAsDataUrl(src: string): Promise<LoadedImage | null> {
  try {
    const res = await fetch(src, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
    if (!dataUrl) return null;

    const mime = blob.type || "";
    let format: "PNG" | "JPEG" = "JPEG";
    if (mime.includes("png") || dataUrl.startsWith("data:image/png")) format = "PNG";
    else if (mime.includes("jpeg") || mime.includes("jpg") || dataUrl.startsWith("data:image/jpeg"))
      format = "JPEG";
    else if (mime.includes("webp") || mime.includes("gif")) {
      // Convert unsupported formats via canvas → JPEG
      const converted = await rasterToJpeg(dataUrl);
      return converted ? { dataUrl: converted, format: "JPEG" } : null;
    } else if (!mime.startsWith("image/")) {
      return null;
    }

    return { dataUrl, format };
  } catch {
    return null;
  }
}

function rasterToJpeg(dataUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.92));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

function formatValue(field: FieldDef, raw: unknown): string {
  if (raw == null || raw === "") return "—";
  if (field.kind === "number" && typeof raw === "number") {
    return Number.isFinite(raw) ? raw.toLocaleString("en-PK") : String(raw);
  }
  return String(raw);
}

function isLikelyImage(file: PdfAttachment): boolean {
  const probe = `${file.url ?? ""} ${file.name ?? ""}`.toLowerCase();
  if (/\.pdf(\?|$)/i.test(probe)) return false;
  return /\.(png|jpe?g|jfif|webp|gif|bmp)(\?|$)/i.test(probe) || /\/image\/upload\//i.test(file.url ?? "");
}

function labelForAttachment(schema: FieldDef[], key: string): string {
  const field = schema.find((f) => f.attachmentKey === key);
  return field?.label ?? key;
}

function drawPageChrome(
  doc: jsPDF,
  opts: { caseLabel: string; docType: string; pageNo: number; pageCount: number },
) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  doc.setDrawColor(...INK.line);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, pageH - 14, pageW - MARGIN, pageH - 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...INK.soft);
  doc.text(`Serve Humanity  ·  ${opts.docType}  ·  ${opts.caseLabel}`, MARGIN, pageH - 8);
  doc.text(`${opts.pageNo} / ${opts.pageCount}`, pageW - MARGIN, pageH - 8, { align: "right" });
}

function fitImageOnPage(
  doc: jsPDF,
  img: LoadedImage,
  area: { x: number; y: number; maxW: number; maxH: number },
) {
  const props = doc.getImageProperties(img.dataUrl);
  const ratio = Math.min(area.maxW / props.width, area.maxH / props.height);
  const w = props.width * ratio;
  const h = props.height * ratio;
  const x = area.x + (area.maxW - w) / 2;
  const y = area.y + (area.maxH - h) / 2;
  doc.addImage(img.dataUrl, img.format, x, y, w, h, undefined, "FAST");
}

/**
 * Build a printable PDF for a documentation record (no download).
 */
export async function buildDocumentationPdf(
  input: DocumentationPdfInput,
): Promise<{ blob: Blob; filename: string }> {
  const schema = DOC_FIELD_SCHEMAS[input.type];
  const attachments = input.attachments ?? [];
  const fields = input.fields ?? {};
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const typeLabel = docTypeLabel(input.type);

  const heading =
    input.caseNumber ||
    input.title ||
    String(fields.driveName ?? fields.referenceNumber ?? fields.periodLabel ?? "Documentation File");

  const beneficiary =
    typeof fields.beneficiaryName === "string" && fields.beneficiaryName.trim()
      ? fields.beneficiaryName.trim()
      : "";

  // ── Page 1: clean form summary ──
  const logoUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/logo.png`;
  const logo = await loadImageAsDataUrl(logoUrl);

  let y = 18;
  if (logo) {
    try {
      doc.addImage(logo.dataUrl, logo.format, MARGIN, y - 4, 18, 18);
    } catch {
      // ignore
    }
  }

  const titleX = logo ? MARGIN + 22 : MARGIN;
  doc.setTextColor(...INK.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Serve Humanity", titleX, y + 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...INK.soft);
  doc.text("Khidmat-e-Insaniyat Welfare Society", titleX, y + 10);

  y = 40;
  doc.setDrawColor(...INK.line);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, pageW - MARGIN, y);
  y += 10;

  doc.setTextColor(...INK.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(typeLabel, MARGIN, y);
  y += 7;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(String(heading), MARGIN, y);
  y += 6;

  if (beneficiary) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...INK.text);
    doc.text(`Beneficiary: ${beneficiary}`, MARGIN, y);
    y += 6;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...INK.soft);
  const meta = [
    input.chapterName ? `Chapter: ${input.chapterName}` : null,
    input.status ? `Status: ${input.status}` : null,
    `Date: ${new Date().toLocaleDateString()}`,
    input.generatedBy ? `Prepared by: ${input.generatedBy}` : null,
  ]
    .filter(Boolean)
    .join("     ");
  if (meta) {
    doc.text(meta, MARGIN, y);
    y += 8;
  } else {
    y += 4;
  }

  const textRows: string[][] = [];
  for (const field of schema) {
    if (field.kind === "files") continue;
    let raw: unknown;
    if (field.key === "caseNumber") raw = input.caseNumber ?? fields.caseNumber;
    else if (field.key === "notes") raw = input.notes ?? fields.notes;
    else raw = fields[field.key];
    textRows.push([field.label, formatValue(field, raw)]);
  }

  autoTable(doc, {
    startY: y,
    head: [["Particulars", "Information"]],
    body: textRows,
    theme: "plain",
    styles: {
      fontSize: 9,
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      valign: "top",
      textColor: INK.text,
      lineColor: INK.softLine,
      lineWidth: 0.25,
      font: "helvetica",
    },
    headStyles: {
      fillColor: INK.headerBg,
      textColor: INK.text,
      fontStyle: "bold",
      lineWidth: 0.25,
      lineColor: INK.line,
    },
    bodyStyles: {
      fillColor: INK.white,
    },
    alternateRowStyles: {
      fillColor: [252, 252, 252],
    },
    columnStyles: {
      0: { cellWidth: 68, fontStyle: "bold", textColor: INK.soft },
      1: { cellWidth: "auto" },
    },
    tableLineColor: INK.softLine,
    tableLineWidth: 0.25,
    margin: { left: MARGIN, right: MARGIN },
    didDrawCell: (data) => {
      // Draw light borders for a form look
      if (data.section === "body" || data.section === "head") {
        doc.setDrawColor(...INK.softLine);
        doc.setLineWidth(0.2);
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height);
      }
    },
  });

  // Collect image slots — CNIC front+back share one frame
  type ImageSlot =
    | { kind: "single"; label: string; note?: string; url: string }
    | { kind: "cnicPair"; label: string; frontUrl?: string; backUrl?: string; frontNote?: string; backNote?: string };

  const slots: ImageSlot[] = [];
  const fileFields = schema.filter((f) => f.kind === "files" && f.attachmentKey);
  const usedKeys = new Set<string>();
  const seenIdGroups = new Set<string>();

  for (const field of fileFields) {
    if (field.idCardGroup) {
      if (seenIdGroups.has(field.idCardGroup)) continue;
      seenIdGroups.add(field.idCardGroup);

      const groupFields = fileFields.filter((f) => f.idCardGroup === field.idCardGroup);
      const frontField = groupFields.find((f) => f.idCardSide === "front");
      const backField = groupFields.find((f) => f.idCardSide === "back");
      if (frontField?.attachmentKey) usedKeys.add(frontField.attachmentKey);
      if (backField?.attachmentKey) usedKeys.add(backField.attachmentKey);

      const frontFile = frontField?.attachmentKey
        ? attachments.find((a) => a.key === frontField.attachmentKey && a.url && isLikelyImage(a))
        : undefined;
      const backFile = backField?.attachmentKey
        ? attachments.find((a) => a.key === backField.attachmentKey && a.url && isLikelyImage(a))
        : undefined;

      if (!frontFile && !backFile) continue;

      slots.push({
        kind: "cnicPair",
        label: field.idCardTitle ?? field.label,
        frontUrl: frontFile?.url,
        backUrl: backFile?.url,
        frontNote: frontFile?.note,
        backNote: backFile?.note,
      });
      continue;
    }

    if (!field.attachmentKey || usedKeys.has(field.attachmentKey)) continue;
    usedKeys.add(field.attachmentKey);

    const files = attachments.filter(
      (a) => a.key === field.attachmentKey && a.url && isLikelyImage(a),
    );
    for (const file of files) {
      slots.push({
        kind: "single",
        label: field.label,
        note: file.note,
        url: file.url!,
      });
    }
  }

  for (const file of attachments) {
    if (!file.url || !isLikelyImage(file) || usedKeys.has(file.key)) continue;
    usedKeys.add(file.key);
    slots.push({
      kind: "single",
      label: labelForAttachment(schema, file.key),
      note: file.note,
      url: file.url,
    });
  }

  // Non-image attachments note on last form page (names only, no links)
  const nonImages = attachments.filter((a) => a.url && !isLikelyImage(a));
  if (nonImages.length) {
    const lastY =
      (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 120;
    let ny = lastY + 12;
    if (ny > pageH - 40) {
      doc.addPage();
      ny = 24;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...INK.text);
    doc.text("Other attached documents", MARGIN, ny);
    ny += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...INK.soft);
    for (const file of nonImages) {
      const label = labelForAttachment(schema, file.key);
      doc.text(`• ${label}: ${file.name || "File attached"}`, MARGIN + 2, ny);
      ny += 5;
    }
  }

  // ── Four frames per page (2 × 2). CNIC front+back share one frame. ──
  const gap = 6;
  const headerH = 22;
  const footerReserve = 18;
  const gridTop = headerH;
  const gridBottom = pageH - footerReserve;
  const cellW = (pageW - MARGIN * 2 - gap) / 2;
  const cellH = (gridBottom - gridTop - gap) / 2;

  async function drawSingleInCell(
    x: number,
    y: number,
    w: number,
    h: number,
    title: string,
    url: string,
    note?: string,
  ) {
    doc.setDrawColor(...INK.softLine);
    doc.setLineWidth(0.3);
    doc.rect(x, y, w, h);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...INK.text);
    const labelLines = doc.splitTextToSize(title, w - 6);
    doc.text(labelLines, x + 3, y + 5);

    let labelBlock = Math.min(labelLines.length * 3.5 + 2, 12);
    if (note) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...INK.soft);
      const noteLines = doc.splitTextToSize(note, w - 6);
      doc.text(noteLines.slice(0, 2), x + 3, y + 5 + labelBlock);
      labelBlock += Math.min(noteLines.length, 2) * 3 + 1;
    }

    const imgArea = {
      x: x + 3,
      y: y + 4 + labelBlock,
      maxW: w - 6,
      maxH: h - labelBlock - 8,
    };
    const loaded = await loadImageAsDataUrl(url);
    if (loaded && imgArea.maxH > 10) {
      try {
        fitImageOnPage(doc, loaded, imgArea);
      } catch {
        doc.setFontSize(8);
        doc.setTextColor(...INK.soft);
        doc.text("Could not load image", x + 3, y + h / 2);
      }
    } else {
      doc.setFontSize(8);
      doc.setTextColor(...INK.soft);
      doc.text("Preview unavailable", x + 3, y + h / 2);
    }
  }

  async function drawCnicPairInCell(
    x: number,
    y: number,
    w: number,
    h: number,
    slot: Extract<ImageSlot, { kind: "cnicPair" }>,
  ) {
    doc.setDrawColor(...INK.line);
    doc.setLineWidth(0.4);
    doc.rect(x, y, w, h);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...INK.text);
    doc.text(slot.label, x + 3, y + 5);

    const innerTop = y + 8;
    const innerH = h - 11;
    const halfGap = 3;
    const halfW = (w - 6 - halfGap) / 2;

    const halves: { title: string; url?: string; note?: string; ox: number }[] = [
      { title: "Front", url: slot.frontUrl, note: slot.frontNote, ox: x + 3 },
      { title: "Back", url: slot.backUrl, note: slot.backNote, ox: x + 3 + halfW + halfGap },
    ];

    for (const half of halves) {
      doc.setDrawColor(...INK.softLine);
      doc.setLineWidth(0.25);
      doc.rect(half.ox, innerTop, halfW, innerH);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...INK.soft);
      doc.text(half.title, half.ox + 2, innerTop + 4);

      if (!half.url) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.text("Not uploaded", half.ox + 2, innerTop + innerH / 2);
        continue;
      }

      const loaded = await loadImageAsDataUrl(half.url);
      const area = {
        x: half.ox + 2,
        y: innerTop + 6,
        maxW: halfW - 4,
        maxH: innerH - 10,
      };
      if (loaded && area.maxH > 8) {
        try {
          fitImageOnPage(doc, loaded, area);
        } catch {
          doc.setFontSize(7);
          doc.text("Unavailable", half.ox + 2, innerTop + innerH / 2);
        }
      } else {
        doc.setFontSize(7);
        doc.text("Unavailable", half.ox + 2, innerTop + innerH / 2);
      }
    }
  }

  for (let i = 0; i < slots.length; i += 4) {
    doc.addPage();

    doc.setTextColor(...INK.text);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Supporting Documents", MARGIN, 14);
    doc.setDrawColor(...INK.line);
    doc.setLineWidth(0.35);
    doc.line(MARGIN, 16.5, pageW - MARGIN, 16.5);

    const chunk = slots.slice(i, i + 4);
    for (let idx = 0; idx < chunk.length; idx++) {
      const item = chunk[idx];
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = MARGIN + col * (cellW + gap);
      const y = gridTop + row * (cellH + gap);

      if (item.kind === "cnicPair") {
        await drawCnicPairInCell(x, y, cellW, cellH, item);
      } else {
        await drawSingleInCell(x, y, cellW, cellH, item.label, item.url, item.note);
      }
    }
  }

  // Footers on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawPageChrome(doc, {
      caseLabel: String(heading).slice(0, 40),
      docType: typeLabel,
      pageNo: i,
      pageCount,
    });
  }

  const safeName = String(heading)
    .replace(/[^\w\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 60);
  const filename = `SH_${input.type}_${safeName || "document"}.pdf`;
  const blob = doc.output("blob");
  return { blob, filename };
}

/** Build PDF and trigger browser download. */
export async function downloadDocumentationPdf(
  input: DocumentationPdfInput,
): Promise<{ blob: Blob; filename: string }> {
  const result = await buildDocumentationPdf(input);
  // Trigger local download only
  const url = URL.createObjectURL(result.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = result.filename;
  a.click();
  URL.revokeObjectURL(url);
  return result;
}
