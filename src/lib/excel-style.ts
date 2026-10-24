import * as XLSX from "xlsx-js-style";

/** Brand blue header — white bold text, wrap, readable width. */
export const EXCEL_HEADER_STYLE = {
  font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
  fill: { patternType: "solid" as const, fgColor: { rgb: "0B3D91" } },
  alignment: {
    horizontal: "center" as const,
    vertical: "center" as const,
    wrapText: true,
  },
  border: {
    top: { style: "thin" as const, color: { rgb: "08306B" } },
    bottom: { style: "thin" as const, color: { rgb: "08306B" } },
    left: { style: "thin" as const, color: { rgb: "08306B" } },
    right: { style: "thin" as const, color: { rgb: "08306B" } },
  },
};

function cellText(cell: XLSX.CellObject | undefined): string {
  if (!cell || cell.v == null) return "";
  return String(cell.v);
}

/**
 * Styles row 0 as a colored wrapping header and sizes columns from
 * header + body content so full header names stay readable.
 */
export function applyExcelHeaderLayout(
  ws: XLSX.WorkSheet,
  opts?: { minWch?: number; maxWch?: number; headerHeight?: number },
) {
  const minWch = opts?.minWch ?? 12;
  const maxWch = opts?.maxWch ?? 42;
  const headerHeight = opts?.headerHeight ?? 36;
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  const cols: { wch: number }[] = [];

  for (let C = range.s.c; C <= range.e.c; C++) {
    const headerAddr = XLSX.utils.encode_cell({ r: 0, c: C });
    const headerCell = ws[headerAddr] as XLSX.CellObject | undefined;
    if (headerCell) {
      headerCell.s = { ...(headerCell.s || {}), ...EXCEL_HEADER_STYLE };
    }

    let widest = Math.max(minWch, cellText(headerCell).length + 2);
    for (let R = range.s.r + 1; R <= range.e.r; R++) {
      const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })] as XLSX.CellObject | undefined;
      const len = cellText(cell).length + 2;
      if (len > widest) widest = len;
    }
    cols.push({ wch: Math.min(maxWch, Math.max(minWch, widest)) });
  }

  ws["!cols"] = cols;
  const rows = ws["!rows"] ? [...ws["!rows"]] : [];
  rows[0] = { ...(rows[0] || {}), hpt: headerHeight };
  ws["!rows"] = rows;
}

export function downloadStyledAoaExcel(
  aoa: (string | number)[][],
  sheetName: string,
  filename: string,
) {
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  applyExcelHeaderLayout(ws);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, filename);
}
