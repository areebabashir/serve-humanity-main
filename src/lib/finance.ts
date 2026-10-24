/**
 * Finance file types for BOG Finance Head / chapter Finance team.
 */

export type FinanceType = "monthly_donation" | "case";

export interface FinanceNavItem {
  type: FinanceType | "hub";
  title: string;
  path: string;
  description: string;
}

export const FINANCE_NAV: FinanceNavItem[] = [
  {
    type: "hub",
    title: "Overview",
    path: "/finance",
    description: "Finance team files across chapters",
  },
  {
    type: "monthly_donation",
    title: "Monthly Team Donations",
    path: "/finance/monthly-donations",
    description: "BOG, cabinet, directors, ADs & alumni donations with screenshots",
  },
  {
    type: "case",
    title: "Finance Case Files",
    path: "/finance/case-files",
    description: "Monthly case disbursements — beneficiary, refs, payment SS",
  },
];

export function financeTypeLabel(type: FinanceType): string {
  return FINANCE_NAV.find((n) => n.type === type)?.title ?? type;
}

export interface DonationPerson {
  id: string;
  name: string;
  amount: number | "";
  description?: string;
  /** Attachment key suffix used with attachments array */
  ssKey: string;
}

export interface CabinetMemberBlock {
  id: string;
  /** Role / team label shown in yellow column (e.g. President, Team Finance) */
  role: string;
  name: string;
  amount: number | "";
  ssKey: string;
  directors: DonationPerson[];
  assistantDirectors: DonationPerson[];
}

export interface MonthlyDonationFields {
  teamName: string;
  bogHeadName: string;
  bogHeadAmount: number | "";
  bogHeadSsKey: string;
  cabinetMembers: CabinetMemberBlock[];
  alumni: DonationPerson[];
  /** Optional second account (e.g. "Nayyab bhai account") */
  otherAccountName: string;
  otherAccountAmount: number | "";
}

export function emptyDonationPerson(prefix: string): DonationPerson {
  const id = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return { id, name: "", amount: "", description: "", ssKey: `ss_${id}` };
}

export function emptyCabinetMember(role = ""): CabinetMemberBlock {
  const id = `cab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    id,
    role,
    name: "",
    amount: "",
    ssKey: `ss_${id}`,
    directors: [],
    assistantDirectors: [],
  };
}

export function emptyMonthlyDonationFields(): MonthlyDonationFields {
  const bogId = `bog-${Date.now()}`;
  return {
    teamName: "Finance",
    bogHeadName: "",
    bogHeadAmount: "",
    bogHeadSsKey: `ss_${bogId}`,
    cabinetMembers: [],
    alumni: [],
    otherAccountName: "",
    otherAccountAmount: "",
  };
}

function num(v: number | "" | undefined | null): number {
  if (v === "" || v == null || Number.isNaN(Number(v))) return 0;
  return Number(v);
}

export function calcDonationTotals(fields: MonthlyDonationFields) {
  const bogTotal = num(fields.bogHeadAmount);
  let cabinetTotal = 0;
  let directorsTotal = 0;
  let adsTotal = 0;
  let teamTotal = 0;

  for (const cab of fields.cabinetMembers || []) {
    cabinetTotal += num(cab.amount);
    for (const d of cab.directors || []) directorsTotal += num(d.amount);
    for (const a of cab.assistantDirectors || []) adsTotal += num(a.amount);
  }

  teamTotal = cabinetTotal + directorsTotal + adsTotal;
  const alumniTotal = (fields.alumni || []).reduce((s, a) => s + num(a.amount), 0);
  const societyTotal = bogTotal + teamTotal + alumniTotal;
  const otherAccount = num(fields.otherAccountAmount);
  /** Matches sheet: "Total Amount in Finance Account" */
  const financeAccountTotal = societyTotal;
  const grandTotal = financeAccountTotal + otherAccount;

  return {
    totalBogDonation: bogTotal,
    totalCabinetDonation: cabinetTotal,
    totalDirectorsDonation: directorsTotal,
    totalAdsDonation: adsTotal,
    eachTeamTotal: teamTotal,
    totalAlumniDonation: alumniTotal,
    totalSocietyMembersDonation: societyTotal,
    financeAccountTotal,
    otherAccountTotal: otherAccount,
    grandTotal,
  };
}

export interface FinanceCaseFields {
  caseNo: string;
  beneficiaryName: string;
  amount: number | "";
  date: string;
  collaboration: string;
  receiverName: string;
  firstReference: string;
  firstReferencePhone: string;
  secondReference: string;
}

export const CASE_FIELD_LABELS: {
  key: keyof FinanceCaseFields;
  label: string;
  kind: "text" | "number" | "date" | "textarea";
  required?: boolean;
}[] = [
  { key: "caseNo", label: "Case No", kind: "text", required: true },
  { key: "beneficiaryName", label: "Beneficiary Name", kind: "text" },
  { key: "amount", label: "Amount (PKR)", kind: "number", required: true },
  { key: "date", label: "Date", kind: "date" },
  { key: "collaboration", label: "Collaboration (NILL / See Note)", kind: "text" },
  { key: "receiverName", label: "Receiver’s Name", kind: "text", required: true },
  { key: "firstReference", label: "1st Reference", kind: "text" },
  { key: "firstReferencePhone", label: "1st Reference Phn No", kind: "text" },
  { key: "secondReference", label: "2nd Reference (Serve Humanity)", kind: "text" },
];

export function emptyCaseFields(): FinanceCaseFields {
  return {
    caseNo: "",
    beneficiaryName: "",
    amount: "",
    date: "",
    collaboration: "",
    receiverName: "",
    firstReference: "",
    firstReferencePhone: "",
    secondReference: "",
  };
}

export function fmtPKR(n: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}
