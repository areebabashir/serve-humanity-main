import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx-js-style";

import { fmtPKR, type FinanceCaseFields } from "@/lib/finance";

export interface MonthlyCaseRow {
  caseNo: string;
  beneficiaryName?: string;
  amount: number;
  date: string;
  collaboration: string;
  receiverName: string;
  firstReference?: string;
  firstReferencePhone?: string;
  secondReference?: string;
}

export interface MonthlyCaseExportInput {
  month: string;
  chapterName?: string;
  cases: MonthlyCaseRow[];
  description?: string;
  generatedBy?: string;
}

const MARGIN = 12;
const INK = {
  text: [28, 28, 28] as [number, number, number],
  soft: [90, 90, 90] as [number, number, number],
  headerBg: [198, 224, 180] as [number, number, number],
  noteBg: [255, 230, 200] as [number, number, number],
};

function safeFilePart(s: string) {
  return String(s || "file")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "_")
    .slice(0, 60);
}

function totalAmount(cases: MonthlyCaseRow[]): number {
  return cases.reduce((s, c) => s + (Number(c.amount) || 0), 0);
}

/** Monthly ledger PDF (kept for optional use). */
export async function buildMonthlyCasesPdf(input: MonthlyCaseExportInput): Promise<{
  blob: Blob;
  filename: string;
}> {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = MARGIN;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...INK.text);
  doc.text(`${input.month || "Month"} Month Cases`, MARGIN, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [
      [
        "Month",
        "Case No",
        "Beneficiary",
        "Amount",
        "Date",
        "Collaboration",
        "Receiver",
        "1st Ref",
        "1st Ref Phn",
        "2nd Ref (SH)",
      ],
    ],
    body: input.cases.map((c) => [
      input.month || "—",
      c.caseNo || "—",
      c.beneficiaryName || "—",
      (Number(c.amount) || 0).toLocaleString("en-PK"),
      c.date || "—",
      c.collaboration || "NILL",
      c.receiverName || "—",
      c.firstReference || "—",
      c.firstReferencePhone || "—",
      c.secondReference || "—",
    ]),
    styles: { fontSize: 7, cellPadding: 1.8, textColor: INK.text },
    headStyles: {
      fillColor: INK.headerBg,
      textColor: INK.text,
      fontStyle: "bold",
      halign: "center",
    },
    margin: { left: MARGIN, right: MARGIN },
  });

  // @ts-expect-error jspdf-autotable
  y = (doc.lastAutoTable?.finalY ?? y) + 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Total: ${fmtPKR(totalAmount(input.cases))}`, pageW - MARGIN, y, { align: "right" });

  if (input.description?.trim()) {
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Description", MARGIN, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(doc.splitTextToSize(input.description.trim(), pageW - MARGIN * 2), MARGIN, y);
  }

  const filename = `SH_${safeFilePart(input.month || "month")}_Month_Cases.pdf`;
  return { blob: doc.output("blob"), filename };
}

export async function downloadMonthlyCasesPdf(input: MonthlyCaseExportInput) {
  const { blob, filename } = await buildMonthlyCasesPdf(input);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return { blob, filename };
}

const headerStyle = {
  font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
  fill: { patternType: "solid" as const, fgColor: { rgb: "0B3D91" } },
  alignment: { horizontal: "center" as const, vertical: "center" as const, wrapText: true },
  border: {
    top: { style: "thin" as const, color: { rgb: "08306B" } },
    bottom: { style: "thin" as const, color: { rgb: "08306B" } },
    left: { style: "thin" as const, color: { rgb: "08306B" } },
    right: { style: "thin" as const, color: { rgb: "08306B" } },
  },
};

const cellStyle = {
  font: { sz: 10, color: { rgb: "1B1B1B" } },
  alignment: { vertical: "center" as const, wrapText: true },
  border: {
    top: { style: "thin" as const, color: { rgb: "B0B0B0" } },
    bottom: { style: "thin" as const, color: { rgb: "B0B0B0" } },
    left: { style: "thin" as const, color: { rgb: "B0B0B0" } },
    right: { style: "thin" as const, color: { rgb: "B0B0B0" } },
  },
};

const totalLabelStyle = {
  ...cellStyle,
  font: { bold: true, sz: 10, color: { rgb: "1B1B1B" } },
  fill: { fgColor: { rgb: "FFF2CC" } },
};

const totalValueStyle = {
  ...cellStyle,
  font: { bold: true, sz: 10, color: { rgb: "1B1B1B" } },
  fill: { fgColor: { rgb: "DDEBF7" } },
  alignment: { horizontal: "right" as const, vertical: "center" as const },
};

function styledCell(v: string | number, style: Record<string, unknown>) {
  return { v, t: typeof v === "number" ? ("n" as const) : ("s" as const), s: style };
}

const EXCEL_HEADERS = [
  "Month",
  "Case No",
  "Beneficiary",
  "Amount",
  "Date",
  "Collaboration",
  "Receiver",
  "1st Reference",
  "1st Reference Phn No",
  "2nd Reference (Serve Humanity)",
];

/** Excel with Case No + reference columns and colored header. */
export function buildMonthlyCasesExcel(input: MonthlyCaseExportInput): {
  blob: Blob;
  filename: string;
} {
  const month = input.month || "Month";
  const colCount = EXCEL_HEADERS.length;

  const aoa = [
    EXCEL_HEADERS.map((h) => styledCell(h, headerStyle)),
    ...input.cases.map((c) => {
      const collab = c.collaboration || "NILL";
      const collabStyle = /see note|note/i.test(collab)
        ? { ...cellStyle, fill: { fgColor: { rgb: "FCE4D6" } } }
        : cellStyle;
      return [
        styledCell(month, cellStyle),
        styledCell(c.caseNo || "", cellStyle),
        styledCell(c.beneficiaryName || "", cellStyle),
        styledCell(Number(c.amount) || 0, {
          ...cellStyle,
          alignment: { horizontal: "right", vertical: "center" },
        }),
        styledCell(c.date || "", {
          ...cellStyle,
          alignment: { horizontal: "center", vertical: "center" },
        }),
        styledCell(collab, collabStyle),
        styledCell(c.receiverName || "", cellStyle),
        styledCell(c.firstReference || "", cellStyle),
        styledCell(c.firstReferencePhone || "", cellStyle),
        styledCell(c.secondReference || "", cellStyle),
      ];
    }),
  ];

  const totalRowIdx = aoa.length;
  const totalRow = Array.from({ length: colCount }, (_, i) => {
    if (i === 0) return styledCell("Total", totalLabelStyle);
    if (i === 3) return styledCell(totalAmount(input.cases), totalValueStyle);
    return styledCell("", totalLabelStyle);
  });
  aoa.push(totalRow);

  if (input.description?.trim()) {
    aoa.push([
      styledCell("Description", totalLabelStyle),
      styledCell(input.description.trim(), {
        ...cellStyle,
        alignment: { horizontal: "left", vertical: "center", wrapText: true },
      }),
      ...Array.from({ length: colCount - 2 }, () => styledCell("", cellStyle)),
    ]);
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  ws["!cols"] = EXCEL_HEADERS.map((h) => ({
    wch: Math.min(42, Math.max(14, Math.ceil(h.length * 1.2) + 2)),
  }));
  ws["!rows"] = [{ hpt: 36 }];

  if (input.description?.trim()) {
    const descRow = totalRowIdx + 1;
    ws["!merges"] = [{ s: { r: descRow, c: 1 }, e: { r: descRow, c: colCount - 1 } }];
  }

  XLSX.utils.book_append_sheet(wb, ws, `${month.slice(0, 28)} Cases`);

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const filename = `SH_${safeFilePart(month)}_Month_Cases.xlsx`;
  return { blob, filename };
}

export function downloadMonthlyCasesExcel(input: MonthlyCaseExportInput) {
  const { blob, filename } = buildMonthlyCasesExcel(input);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return { blob, filename };
}

function cellStr(row: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const hit = Object.keys(row).find((rk) => rk.trim().toLowerCase() === k.toLowerCase());
    if (hit != null && row[hit] != null && String(row[hit]).trim() !== "") {
      return String(row[hit]).trim();
    }
  }
  return "";
}

function pickByIndex(row: Record<string, unknown>, index: number): string {
  const vals = Object.values(row);
  const v = vals[index];
  return v == null ? "" : String(v).trim();
}

/** Parse Excel into case rows for bulk import. */
export async function parseMonthlyCasesExcel(file: File): Promise<Partial<FinanceCaseFields>[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  const results: Partial<FinanceCaseFields>[] = [];
  for (const row of json) {
    const keys = Object.keys(row);
    const firstKey = keys[0] || "";
    const firstVal = String(row[firstKey] ?? "").trim().toLowerCase();
    if (
      !firstVal ||
      firstVal === "total" ||
      firstVal === "description" ||
      firstVal.includes("total")
    )
      continue;

    let caseNo = cellStr(row, ["case no", "case number", "case#", "case"]);
    let beneficiaryName = cellStr(row, ["beneficiary", "patient", "beneficiary name"]);
    let amountRaw = cellStr(row, ["amount"]);
    let date = cellStr(row, ["date"]);
    let collaboration = cellStr(row, ["collaboration", "partner"]);
    let receiverName = cellStr(row, ["receiver", "receiver’s name", "receiver name"]);
    let firstReference = cellStr(row, ["1st reference", "first reference", "1st ref"]);
    let firstReferencePhone = cellStr(row, [
      "1st reference phn no",
      "1st reference phone",
      "first reference phone",
      "1st ref phn",
    ]);
    let secondReference = cellStr(row, [
      "2nd reference (serve humanity)",
      "2nd reference",
      "second reference",
    ]);

    // Month | Case No | Beneficiary | Amount | Date | Collaboration | Receiver | 1st Ref | Phn | 2nd Ref
    if (!caseNo && keys.length >= 3) {
      caseNo = pickByIndex(row, 1);
      if (!beneficiaryName) beneficiaryName = pickByIndex(row, 2);
      if (!amountRaw) amountRaw = pickByIndex(row, 3);
      if (!date) date = pickByIndex(row, 4);
      if (!collaboration) collaboration = pickByIndex(row, 5);
      if (!receiverName) receiverName = pickByIndex(row, 6);
      if (!firstReference) firstReference = pickByIndex(row, 7);
      if (!firstReferencePhone) firstReferencePhone = pickByIndex(row, 8);
      if (!secondReference) secondReference = pickByIndex(row, 9);
    }

    const amountNum = Number(String(amountRaw).replace(/,/g, ""));
    if (!caseNo && !amountNum) continue;
    if (String(caseNo).toLowerCase() === "total" || String(caseNo).toLowerCase() === "month")
      continue;

    results.push({
      caseNo: caseNo || "—",
      beneficiaryName: beneficiaryName || "",
      amount: Number.isFinite(amountNum) ? amountNum : "",
      date: date || "",
      collaboration: collaboration || "NILL",
      receiverName: receiverName || "",
      firstReference: firstReference || "",
      firstReferencePhone: firstReferencePhone || "",
      secondReference: secondReference || "",
    });
  }
  return results;
}
