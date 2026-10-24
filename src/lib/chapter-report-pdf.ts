import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export type ChapterReport = {
  chapter: {
    id: string;
    name: string;
    city: string;
    status: string;
    established?: string | null;
    monthlyBudget: number;
    monthlySpent: number;
    fundsRaised: number;
  };
  president: { name: string; email: string; phone: string };
  summary: {
    members: number;
    activeMembers: number;
    teamAccounts: number;
    fundsRaised: number;
    donationsPending: number;
    donationsVerified: number;
    donationsRejected: number;
    publicDonations: number;
    publicDonationCount: number;
    teamDonationCount: number;
    casesPending: number;
    casesDone: number;
    casesRejected: number;
    docPending: number;
    docRunning: number;
    docComplete: number;
    eventsTotal: number;
    eventsPending: number;
    eventsApproved: number;
    eventsCompleted: number;
  };
  members: Array<{
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    joinedAt?: string;
  }>;
  team: Array<{ name: string; email: string; phone: string; role: string }>;
  donations: Array<{
    donor: string;
    amount: number;
    status: string;
    note: string;
    date?: string;
  }>;
  cases: Array<{
    caseId: string;
    applicant: string;
    category: string;
    amount: number;
    status: string;
    urgency: string;
    date?: string;
  }>;
  events: Array<{
    title: string;
    date?: string;
    venue: string;
    status: string;
    attendees: number;
  }>;
};

export type OrgReportTotals = {
  chapters: number;
  members: number;
  fundsRaised: number;
  donationsVerified: number;
  donationsPending: number;
  casesPending: number;
  casesDone: number;
  docPending: number;
  docRunning: number;
  docComplete: number;
  eventsTotal: number;
};

/** Serve Humanity logo palette */
const BRAND = {
  blue: [27, 78, 129] as [number, number, number], // #1B4E81
  blueMid: [35, 74, 143] as [number, number, number], // #234A8F
  orange: [248, 148, 30] as [number, number, number], // #F8941E
  orangeDeep: [244, 93, 34] as [number, number, number],
  text: [31, 45, 61] as [number, number, number],
  soft: [107, 114, 128] as [number, number, number],
  line: [232, 236, 243] as [number, number, number],
  headerBg: [232, 240, 250] as [number, number, number],
  orangeBg: [255, 246, 232] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

const MARGIN = 14;

type LoadedImage = { dataUrl: string; format: "PNG" | "JPEG" };

async function loadLogo(preferredSrc?: string): Promise<LoadedImage | null> {
  const candidates = [
    preferredSrc,
    `${typeof window !== "undefined" ? window.location.origin : ""}/logo.png`,
  ].filter(Boolean) as string[];

  for (const src of candidates) {
    try {
      const res = await fetch(src, { mode: "cors" });
      if (!res.ok) continue;
      const blob = await res.blob();
      const dataUrl = await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () =>
          resolve(typeof reader.result === "string" ? reader.result : null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
      if (!dataUrl) continue;
      const mime = blob.type || "";
      const format: "PNG" | "JPEG" =
        mime.includes("png") || dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
      return { dataUrl, format };
    } catch {
      /* try next */
    }
  }
  return null;
}

function fmtPKR(n: number) {
  if (!n || n <= 0) return "PKR 0";
  return `PKR ${Number(n).toLocaleString()}`;
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function safeFilePart(s: string) {
  return String(s || "report")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "_")
    .slice(0, 50);
}

function lastY(doc: jsPDF) {
  return (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 40;
}

function ensureSpace(doc: jsPDF, y: number, need = 40) {
  if (y + need < 275) return y;
  doc.addPage();
  return 18;
}

function sectionTitle(doc: jsPDF, title: string, y: number) {
  doc.setFillColor(...BRAND.orange);
  doc.rect(MARGIN, y - 4, 2.2, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.blue);
  doc.text(title, MARGIN + 5, y);
  return y + 7;
}

function writeBrandedHeader(
  doc: jsPDF,
  title: string,
  generatedAt: string,
  logo: LoadedImage | null,
) {
  const pageW = doc.internal.pageSize.getWidth();

  // Top brand bar
  doc.setFillColor(...BRAND.blue);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setFillColor(...BRAND.orange);
  doc.rect(0, 28, pageW, 2.2, "F");

  if (logo) {
    try {
      // white circle-ish backing for logo clarity
      doc.setFillColor(...BRAND.white);
      doc.circle(MARGIN + 9, 14, 10, "F");
      doc.addImage(logo.dataUrl, logo.format, MARGIN + 1, 5, 16, 16);
    } catch {
      // ignore
    }
  }

  const titleX = logo ? MARGIN + 24 : MARGIN;
  doc.setTextColor(...BRAND.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Serve Humanity", titleX, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Khidmat-e-Insaniyat Welfare Society", titleX, 18);
  doc.setFontSize(7.5);
  doc.text(`Generated ${fmtDate(generatedAt)} · ${new Date(generatedAt).toLocaleTimeString()}`, titleX, 23.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...BRAND.blue);
  doc.text(title, MARGIN, 40);

  doc.setDrawColor(...BRAND.line);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, 43, pageW - MARGIN, 43);

  return 50;
}

function addChapterDetail(
  doc: jsPDF,
  report: ChapterReport,
  startY: number,
  withPageHeader = false,
  logo: LoadedImage | null = null,
  generatedAt = "",
) {
  let y = startY;
  if (withPageHeader) {
    y = writeBrandedHeader(doc, `Chapter — ${report.chapter.name}`, generatedAt || new Date().toISOString(), logo);
  }

  const c = report.chapter;
  const p = report.president;
  const s = report.summary;

  // Chapter info card
  doc.setFillColor(...BRAND.orangeBg);
  doc.roundedRect(MARGIN, y, 182, 22, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.blue);
  doc.text(`${c.name}${c.city ? `  ·  ${c.city}` : ""}`, MARGIN + 4, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...BRAND.text);
  doc.text(
    `President: ${p.name}   |   ${p.email || "no email"}   |   ${p.phone || "no phone"}`,
    MARGIN + 4,
    y + 13,
  );
  doc.setTextColor(...BRAND.soft);
  doc.text(
    `Status: ${c.status || "—"}   ·   Established: ${fmtDate(c.established)}   ·   Budget ${fmtPKR(c.monthlyBudget)}`,
    MARGIN + 4,
    y + 18.5,
  );
  y += 28;

  y = sectionTitle(doc, "Summary", y);
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Metric", "Value", "Metric", "Value"]],
    body: [
      ["Members", String(s.members), "Active members", String(s.activeMembers)],
      ["Team accounts", String(s.teamAccounts), "Funds raised", fmtPKR(s.fundsRaised)],
      ["Donations verified", fmtPKR(s.donationsVerified), "Donations pending", fmtPKR(s.donationsPending)],
      ["Public donations", fmtPKR(s.publicDonations), "Team donation count", String(s.teamDonationCount)],
      ["Cases pending", String(s.casesPending), "Cases done", String(s.casesDone)],
      ["Cases rejected", String(s.casesRejected), "Doc pending", String(s.docPending)],
      ["Doc running", String(s.docRunning), "Doc complete", String(s.docComplete)],
      ["Events total", String(s.eventsTotal), "Events completed", String(s.eventsCompleted)],
    ],
    styles: { fontSize: 8, textColor: BRAND.text, cellPadding: 2.2 },
    headStyles: {
      fillColor: BRAND.blue,
      textColor: BRAND.white,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });
  y = lastY(doc) + 10;

  if (report.members.length) {
    y = ensureSpace(doc, y, 50);
    y = sectionTitle(doc, "Members", y);
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [["Name", "Role", "Email", "Phone", "Status"]],
      body: report.members.slice(0, 80).map((m) => [
        m.name,
        m.role,
        m.email,
        m.phone || "—",
        m.status,
      ]),
      styles: { fontSize: 7.5, textColor: BRAND.text, cellPadding: 1.6 },
      headStyles: { fillColor: BRAND.blue, textColor: BRAND.white, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    y = lastY(doc) + 10;
  }

  if (report.team.length) {
    y = ensureSpace(doc, y, 40);
    y = sectionTitle(doc, "Team accounts", y);
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [["Name", "Role", "Email", "Phone"]],
      body: report.team.map((t) => [t.name, t.role, t.email, t.phone || "—"]),
      styles: { fontSize: 7.5, textColor: BRAND.text, cellPadding: 1.6 },
      headStyles: { fillColor: BRAND.blue, textColor: BRAND.white, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    y = lastY(doc) + 10;
  }

  if (report.donations.length) {
    y = ensureSpace(doc, y, 40);
    y = sectionTitle(doc, "Recent team donations", y);
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [["Donor", "Amount", "Status", "Date"]],
      body: report.donations.map((d) => [d.donor, fmtPKR(d.amount), d.status, fmtDate(d.date)]),
      styles: { fontSize: 7.5, textColor: BRAND.text, cellPadding: 1.6 },
      headStyles: { fillColor: BRAND.orange, textColor: BRAND.white, fontStyle: "bold" },
      alternateRowStyles: { fillColor: BRAND.orangeBg },
    });
    y = lastY(doc) + 10;
  }

  if (report.cases.length) {
    y = ensureSpace(doc, y, 40);
    y = sectionTitle(doc, "Welfare cases", y);
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [["Case", "Applicant", "Category", "Amount", "Status"]],
      body: report.cases.map((c) => [
        c.caseId || "—",
        c.applicant,
        c.category,
        fmtPKR(c.amount),
        c.status,
      ]),
      styles: { fontSize: 7.5, textColor: BRAND.text, cellPadding: 1.6 },
      headStyles: { fillColor: BRAND.blue, textColor: BRAND.white, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    y = lastY(doc) + 10;
  }

  if (report.events.length) {
    y = ensureSpace(doc, y, 40);
    y = sectionTitle(doc, "Events", y);
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [["Title", "Date", "Venue", "Status", "Attendees"]],
      body: report.events.map((e) => [
        e.title,
        fmtDate(e.date),
        e.venue || "—",
        e.status,
        String(e.attendees || 0),
      ]),
      styles: { fontSize: 7.5, textColor: BRAND.text, cellPadding: 1.6 },
      headStyles: { fillColor: BRAND.blue, textColor: BRAND.white, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    y = lastY(doc) + 10;
  }

  // Footer accent
  const pageH = doc.internal.pageSize.getHeight();
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFillColor(...BRAND.orange);
  doc.rect(0, pageH - 4, pageW, 4, "F");

  return y;
}

export async function downloadChapterReportPdf(
  report: ChapterReport,
  generatedAt: string,
  options?: { logoSrc?: string },
) {
  const logo = await loadLogo(options?.logoSrc);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const y = writeBrandedHeader(doc, `Chapter report — ${report.chapter.name}`, generatedAt, logo);
  addChapterDetail(doc, report, y, false, logo, generatedAt);
  doc.save(`SH_${safeFilePart(report.chapter.name)}_report.pdf`);
}

export async function downloadOrgReportPdf(
  totals: OrgReportTotals,
  reports: ChapterReport[],
  generatedAt: string,
) {
  const logo = await loadLogo();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = writeBrandedHeader(doc, "Organization report — All chapters", generatedAt, logo);

  y = sectionTitle(doc, "Organization totals", y);
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Metric", "Value", "Metric", "Value"]],
    body: [
      ["Chapters", String(totals.chapters), "Members", String(totals.members)],
      ["Funds raised", fmtPKR(totals.fundsRaised), "Donations verified", fmtPKR(totals.donationsVerified)],
      ["Donations pending", fmtPKR(totals.donationsPending), "Cases pending", String(totals.casesPending)],
      ["Cases done", String(totals.casesDone), "Events", String(totals.eventsTotal)],
      [
        "Doc pending",
        String(totals.docPending),
        "Doc running / complete",
        `${totals.docRunning} / ${totals.docComplete}`,
      ],
    ],
    styles: { fontSize: 8, textColor: BRAND.text, cellPadding: 2.2 },
    headStyles: { fillColor: BRAND.blue, textColor: BRAND.white, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });
  y = lastY(doc) + 10;

  y = sectionTitle(doc, "Chapters overview", y);
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Chapter", "President", "Members", "Funds", "Cases P/D", "Events"]],
    body: reports.map((r) => [
      `${r.chapter.name}${r.chapter.city ? ` (${r.chapter.city})` : ""}`,
      r.president.name,
      String(r.summary.members),
      fmtPKR(r.summary.fundsRaised),
      `${r.summary.casesPending}/${r.summary.casesDone}`,
      String(r.summary.eventsTotal),
    ]),
    styles: { fontSize: 7.5, textColor: BRAND.text, cellPadding: 1.6 },
    headStyles: { fillColor: BRAND.orange, textColor: BRAND.white, fontStyle: "bold" },
    alternateRowStyles: { fillColor: BRAND.orangeBg },
  });

  for (const report of reports) {
    doc.addPage();
    addChapterDetail(doc, report, 18, true, logo, generatedAt);
  }

  doc.save(`SH_All_Chapters_report.pdf`);
}
