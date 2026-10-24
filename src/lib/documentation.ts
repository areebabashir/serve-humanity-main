/**
 * Documentation type metadata + field schemas for CEO / BOG dashboard forms.
 */

export type DocType =
  | "health"
  | "marriage"
  | "fee"
  | "ration"
  | "monthly_report"
  | "ration_file"
  | "drive"
  | "stat"
  | "reference";

export interface DocNavItem {
  type: DocType | "hub" | "cases";
  title: string;
  path: string;
  description: string;
}

export const DOC_NAV: DocNavItem[] = [
  {
    type: "hub",
    title: "Overview",
    path: "/documentation",
    description: "All chapter documentation at a glance",
  },
  {
    type: "cases",
    title: "All Cases",
    path: "/documentation/cases",
    description: "Health, marriage, fee & ration — Pending / Running / Complete",
  },
  {
    type: "health",
    title: "Health Cases",
    path: "/documentation/health",
    description: "Regular case files — Health",
  },
  {
    type: "marriage",
    title: "Marriage Cases",
    path: "/documentation/marriage",
    description: "Regular case files — Marriage",
  },
  {
    type: "fee",
    title: "Fee Cases",
    path: "/documentation/fee",
    description: "Regular case files — Student Fee",
  },
  {
    type: "ration",
    title: "Ration Cases",
    path: "/documentation/ration",
    description: "Regular case files — Ration",
  },
  {
    type: "monthly_report",
    title: "Monthly Reports",
    path: "/documentation/monthly-reports",
    description: "Monthly chapter documentation reports",
  },
  {
    type: "ration_file",
    title: "Ration Case Files",
    path: "/documentation/ration-files",
    description: "Dedicated ration transfer files",
  },
  {
    type: "drive",
    title: "Drive Files",
    path: "/documentation/drives",
    description: "Drive expense and photo records",
  },
  {
    type: "stat",
    title: "Stat Files",
    path: "/documentation/stats",
    description: "Category totals and overall statistics",
  },
  {
    type: "reference",
    title: "Reference Files",
    path: "/documentation/references",
    description: "Reference numbers and details",
  },
];

export type FieldKind = "text" | "number" | "date" | "textarea" | "select" | "files";

export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  options?: string[];
  /** For files: attachment key stored on the document */
  attachmentKey?: string;
  /** Show a note/description input under each uploaded file */
  allowFileNote?: boolean;
  /** Allow selecting/uploading multiple files (default true for files) */
  multiple?: boolean;
  placeholder?: string;
  /** Group CNIC front+back into one frame (same id for both sides) */
  idCardGroup?: string;
  /** Title shown on the shared CNIC frame */
  idCardTitle?: string;
  idCardSide?: "front" | "back";
}

const commonCaseFields: FieldDef[] = [
  { key: "caseNumber", label: "Case Number", kind: "text", required: true },
  { key: "caseTypeLabel", label: "Case type label", kind: "text", placeholder: "e.g. Health, Marriage, Ration" },
  { key: "beneficiaryName", label: "Beneficiary Name", kind: "text", required: true },
  {
    key: "casePoster",
    label: "Case Poster",
    kind: "files",
    attachmentKey: "casePoster",
  },
  { key: "ref1Name", label: "1st Reference name", kind: "text", required: true },
  { key: "ref1Contact", label: "1st Reference contact", kind: "text", required: true },
  { key: "ref2Name", label: "2nd Reference name", kind: "text" },
  { key: "ref2Contact", label: "2nd Reference contact", kind: "text" },
  { key: "paymentReceiverName", label: "Payment Receiver Name", kind: "text", required: true },
  { key: "paymentDate", label: "Payment Date", kind: "date", required: true },
  {
    key: "paymentMode",
    label: "Payment Mode",
    kind: "select",
    required: true,
    options: ["Online", "Cash"],
  },
  { key: "amount", label: "Amount (PKR)", kind: "number", required: true },
];

export const DOC_FIELD_SCHEMAS: Record<DocType, FieldDef[]> = {
  fee: [
    ...commonCaseFields,
    {
      key: "studentCnicFront",
      label: "Front",
      kind: "files",
      attachmentKey: "studentCnicFront",
      idCardGroup: "studentCnic",
      idCardTitle: "Student B-Form / CNIC",
      idCardSide: "front",
    },
    {
      key: "studentCnicBack",
      label: "Back",
      kind: "files",
      attachmentKey: "studentCnicBack",
      idCardGroup: "studentCnic",
      idCardTitle: "Student B-Form / CNIC",
      idCardSide: "back",
    },
    {
      key: "fatherCnicFront",
      label: "Front",
      kind: "files",
      attachmentKey: "fatherCnicFront",
      idCardGroup: "feeFatherCnic",
      idCardTitle: "Father CNIC",
      idCardSide: "front",
    },
    {
      key: "fatherCnicBack",
      label: "Back",
      kind: "files",
      attachmentKey: "fatherCnicBack",
      idCardGroup: "feeFatherCnic",
      idCardTitle: "Father CNIC",
      idCardSide: "back",
    },
    { key: "studentCard", label: "University Student Card", kind: "files", attachmentKey: "studentCard" },
    { key: "feeChallan", label: "Fee Challan", kind: "files", attachmentKey: "feeChallan" },
    { key: "rentAgreement", label: "Rent Agreement (if applicable)", kind: "files", attachmentKey: "rentAgreement" },
    {
      key: "incomeProof",
      label: "Income proof (photo / payslip PDF)",
      kind: "files",
      attachmentKey: "incomeProof",
      allowFileNote: true,
    },
    { key: "incomeProofNote", label: "Income proof description / note", kind: "textarea" },
    { key: "utilityBills", label: "Electricity / Gas / Water bills (multiple)", kind: "files", attachmentKey: "utilityBills", multiple: true },
    { key: "housePics", label: "House Pics (multiple images)", kind: "files", attachmentKey: "housePics", multiple: true },
    {
      key: "paymentScreenshot",
      label: "Payment Screenshot",
      kind: "files",
      attachmentKey: "paymentScreenshot",
    },
    {
      key: "paidFeeChallan",
      label: "Paid Fee Challan Pics (if available)",
      kind: "files",
      attachmentKey: "paidFeeChallan",
    },
    { key: "notes", label: "Any note or description", kind: "textarea" },
  ],
  ration: [
    ...commonCaseFields,
    {
      key: "cnicFront",
      label: "Front",
      kind: "files",
      attachmentKey: "cnicFront",
      idCardGroup: "rationCnic",
      idCardTitle: "CNIC",
      idCardSide: "front",
    },
    {
      key: "cnicBack",
      label: "Back",
      kind: "files",
      attachmentKey: "cnicBack",
      idCardGroup: "rationCnic",
      idCardTitle: "CNIC",
      idCardSide: "back",
    },
    {
      key: "deathCertificate",
      label: "Death Certificate (if available)",
      kind: "files",
      attachmentKey: "deathCertificate",
    },
    { key: "rentAgreement", label: "Rent Agreement (if applicable)", kind: "files", attachmentKey: "rentAgreement" },
    {
      key: "incomeProof",
      label: "Income proof (photo / payslip PDF)",
      kind: "files",
      attachmentKey: "incomeProof",
      allowFileNote: true,
    },
    { key: "incomeProofNote", label: "Income proof description / note", kind: "textarea" },
    { key: "utilityBills", label: "Electricity / Gas / Water bills (multiple)", kind: "files", attachmentKey: "utilityBills", multiple: true },
    { key: "housePics", label: "House Pics (multiple images)", kind: "files", attachmentKey: "housePics", multiple: true },
    {
      key: "paymentScreenshot",
      label: "Payment Screenshot",
      kind: "files",
      attachmentKey: "paymentScreenshot",
    },
    {
      key: "rashanDeliveredPics",
      label: "Rashan Delivered Pics (multiple images)",
      kind: "files",
      attachmentKey: "rashanDeliveredPics",
      multiple: true,
    },
    { key: "notes", label: "Any note or description", kind: "textarea" },
  ],
  monthly_report: [
    { key: "month", label: "Month", kind: "select", required: true, options: ["January","February","March","April","May","June","July","August","September","October","November","December"] },
    { key: "year", label: "Year", kind: "number", required: true },
    { key: "caseNumbers", label: "Case Number(s) for regular cases", kind: "textarea", placeholder: "e.g. H-2401, M-118, F-55 (2–4 cases per month)" },
    {
      key: "casePaymentScreenshots",
      label: "Case payment Screenshot(s)",
      kind: "files",
      attachmentKey: "casePaymentScreenshots",
    },
    { key: "caseNotes", label: "Any note or description (regular cases)", kind: "textarea" },
    { key: "rationCaseNumbers", label: "Rashan Cases Number(s)", kind: "textarea", placeholder: "e.g. RF-301, RF-302" },
    {
      key: "rationScreenshots",
      label: "Rashan Cases Screenshot(s)",
      kind: "files",
      attachmentKey: "rationScreenshots",
    },
    {
      key: "drivePaymentScreenshots",
      label: "Drive Payment Screenshot(s)",
      kind: "files",
      attachmentKey: "drivePaymentScreenshots",
      allowFileNote: true,
    },
    { key: "driveDetails", label: "Drive Payment details", kind: "textarea" },
    { key: "rationDriveNotes", label: "Any note or Description for Rasha cases and Drives", kind: "textarea" },
    { key: "totalCases", label: "Total Number of cases", kind: "number" },
    { key: "totalAmount", label: "Total Amount transferred in month (Drives + Ration + Regular)", kind: "number" },
    { key: "notes", label: "Any additional note or description", kind: "textarea" },
  ],
  ration_file: [
    { key: "month", label: "Month", kind: "select", required: true, options: ["January","February","March","April","May","June","July","August","September","October","November","December"] },
    { key: "year", label: "Year", kind: "number", required: true },
    { key: "rationCaseNumber", label: "Ration case Number", kind: "text", required: true },
    { key: "transferAmount", label: "Transfer amount", kind: "number", required: true },
    {
      key: "paymentMethod",
      label: "Payment method",
      kind: "select",
      required: true,
      options: ["Online", "Cash", "Bank"],
    },
    { key: "paymentDate", label: "Payment Date", kind: "date", required: true },
    { key: "referenceName", label: "Reference name", kind: "text" },
    { key: "receiverName", label: "Receiver name", kind: "text", required: true },
    { key: "phone", label: "Phone no", kind: "text" },
    { key: "accountNo", label: "Account no", kind: "text" },
    {
      key: "paymentScreenshot",
      label: "Payment Screenshot",
      kind: "files",
      attachmentKey: "paymentScreenshot",
    },
    { key: "notes", label: "Any note description if applicable", kind: "textarea" },
  ],
  drive: [
    { key: "driveName", label: "Drive name", kind: "text", required: true },
    {
      key: "driveType",
      label: "Drive type",
      kind: "select",
      required: true,
      options: [
        "Ramadan Rashan Drive",
        "Winter Drive",
        "Palestine Drive",
        "Flood Food Drive",
        "Medical Camp",
        "Other",
      ],
    },
    { key: "poster", label: "Poster", kind: "files", attachmentKey: "poster" },
    { key: "driveDate", label: "Drive Date", kind: "date", required: true },
    { key: "totalExpense", label: "Total Expense", kind: "number", required: true },
    {
      key: "expenseScreenshots",
      label: "All Expense Screenshot and Bills photo",
      kind: "files",
      attachmentKey: "expenseScreenshots",
      allowFileNote: true,
    },
    {
      key: "expenseDetails",
      label: "Expense details (write label/details for each bill, e.g. Fruit payment…)",
      kind: "textarea",
      placeholder: "Fruit payment — PKR 5,000; Uniform — PKR 20,000; …",
    },
    {
      key: "drivePhotos",
      label: "Drives photo (e.g. uniform pics for winter drive) if available",
      kind: "files",
      attachmentKey: "drivePhotos",
    },
    { key: "notes", label: "Any note or description", kind: "textarea" },
  ],
  health: [
    ...commonCaseFields,
    {
      key: "patientCnicFront",
      label: "Front",
      kind: "files",
      attachmentKey: "patientCnicFront",
      idCardGroup: "patientCnic",
      idCardTitle: "B-Form or CNIC of Patient",
      idCardSide: "front",
    },
    {
      key: "patientCnicBack",
      label: "Back",
      kind: "files",
      attachmentKey: "patientCnicBack",
      idCardGroup: "patientCnic",
      idCardTitle: "B-Form or CNIC of Patient",
      idCardSide: "back",
    },
    { key: "rentAgreement", label: "Rent Agreement if Applicable or available", kind: "files", attachmentKey: "rentAgreement" },
    {
      key: "utilityBills",
      label: "Electricity, Gas and water bills (multiple images)",
      kind: "files",
      attachmentKey: "utilityBills",
      multiple: true,
    },
    {
      key: "housePics",
      label: "House Pics (multiple images)",
      kind: "files",
      attachmentKey: "housePics",
      multiple: true,
    },
    {
      key: "incomeProof",
      label: "Income proof (Photo or pay slip PDF)",
      kind: "files",
      attachmentKey: "incomeProof",
      allowFileNote: true,
    },
    { key: "incomeProofNote", label: "Income proof description / note (required with income proof)", kind: "textarea" },
    {
      key: "medicalReports",
      label: "Medical Report, Tests Report and Medical Expense Bills (multiple images)",
      kind: "files",
      attachmentKey: "medicalReports",
      multiple: true,
    },
    {
      key: "paymentScreenshot",
      label: "Payment Record Screenshot",
      kind: "files",
      attachmentKey: "paymentScreenshot",
    },
    {
      key: "paymentUsagePics",
      label: "Payment Usage pics if Applicable or Available (multiple images)",
      kind: "files",
      attachmentKey: "paymentUsagePics",
      multiple: true,
    },
    { key: "notes", label: "Any note or description if Applicable", kind: "textarea" },
  ],
  marriage: [
    ...commonCaseFields,
    {
      key: "girlCnicFront",
      label: "Front",
      kind: "files",
      attachmentKey: "girlCnicFront",
      idCardGroup: "girlCnic",
      idCardTitle: "Girl B-Form / CNIC",
      idCardSide: "front",
    },
    {
      key: "girlCnicBack",
      label: "Back",
      kind: "files",
      attachmentKey: "girlCnicBack",
      idCardGroup: "girlCnic",
      idCardTitle: "Girl B-Form / CNIC",
      idCardSide: "back",
    },
    {
      key: "fatherCnicFront",
      label: "Front",
      kind: "files",
      attachmentKey: "fatherCnicFront",
      idCardGroup: "marriageFatherCnic",
      idCardTitle: "Father CNIC",
      idCardSide: "front",
    },
    {
      key: "fatherCnicBack",
      label: "Back",
      kind: "files",
      attachmentKey: "fatherCnicBack",
      idCardGroup: "marriageFatherCnic",
      idCardTitle: "Father CNIC",
      idCardSide: "back",
    },
    { key: "deathCertificate", label: "Death Certificate", kind: "files", attachmentKey: "deathCertificate" },
    { key: "rentAgreement", label: "Rent Agreement if Applicable or available", kind: "files", attachmentKey: "rentAgreement" },
    {
      key: "incomeProof",
      label: "Income proof (Photo or pay slip PDF)",
      kind: "files",
      attachmentKey: "incomeProof",
      allowFileNote: true,
    },
    { key: "incomeProofNote", label: "Income proof description / note", kind: "textarea" },
    {
      key: "utilityBills",
      label: "Electricity, Gas and water bills (multiple images)",
      kind: "files",
      attachmentKey: "utilityBills",
      multiple: true,
    },
    {
      key: "housePics",
      label: "House Pics (multiple images)",
      kind: "files",
      attachmentKey: "housePics",
      multiple: true,
    },
    {
      key: "medicalReports",
      label: "Medical Report or Receipts if Available (multiple images, optional)",
      kind: "files",
      attachmentKey: "medicalReports",
      multiple: true,
    },
    {
      key: "paymentScreenshot",
      label: "Payment Record Screenshot",
      kind: "files",
      attachmentKey: "paymentScreenshot",
    },
    {
      key: "paymentUsagePics",
      label: "Payment Usage pics that is given by Serve Humanity (multiple images)",
      kind: "files",
      attachmentKey: "paymentUsagePics",
      multiple: true,
    },
    { key: "notes", label: "Any note or description if Applicable", kind: "textarea" },
  ],
  stat: [
    { key: "periodLabel", label: "Period label (e.g. 2026-Q1 / Jan 2026)", kind: "text", required: true },
    { key: "emergencyHealthCount", label: "1. Emergency (Health Cases) — number", kind: "number" },
    { key: "emergencyHealthAmount", label: "1. Emergency (Health Cases) — amount", kind: "number" },
    { key: "rozgarCount", label: "2. Rozgar Scheme — number", kind: "number" },
    { key: "rozgarAmount", label: "2. Rozgar Scheme — amount", kind: "number" },
    { key: "messBillCount", label: "3. Mess Bill Cases — number", kind: "number" },
    { key: "messBillAmount", label: "3. Mess Bill Cases — amount", kind: "number" },
    { key: "oneTimeRashanCount", label: "4. One-Time Rashan Cases — number", kind: "number" },
    { key: "oneTimeRashanAmount", label: "4. One-Time Rashan Cases — amount", kind: "number" },
    { key: "monthlyRashanCount", label: "5. Monthly Rashan (Repeated) — number", kind: "number" },
    { key: "monthlyRashanAmount", label: "5. Monthly Rashan (Repeated) — amount", kind: "number" },
    { key: "orphanMarriageCount", label: "6. Orphans’ Marriage — number", kind: "number" },
    { key: "orphanMarriageAmount", label: "6. Orphans’ Marriage — amount", kind: "number" },
    { key: "studentFeesCount", label: "7. Student Fees — number", kind: "number" },
    { key: "studentFeesAmount", label: "7. Student Fees — amount", kind: "number" },
    { key: "ramadanDriveCount", label: "8. Ramadan Rashan Drive — number", kind: "number" },
    { key: "ramadanDriveAmount", label: "8. Ramadan Rashan Drive — amount", kind: "number" },
    { key: "winterDriveCount", label: "9. Winter Drive — number", kind: "number" },
    { key: "winterDriveAmount", label: "9. Winter Drive — amount", kind: "number" },
    { key: "palestineDriveCount", label: "10. Palestine Drive — number", kind: "number" },
    { key: "palestineDriveAmount", label: "10. Palestine Drive — amount", kind: "number" },
    { key: "healthMedicineCount", label: "11. Health and Medicine — number", kind: "number" },
    { key: "healthMedicineAmount", label: "11. Health and Medicine — amount", kind: "number" },
    { key: "medicalCampsCount", label: "12. Medical Camps — number", kind: "number" },
    { key: "medicalCampsAmount", label: "12. Medical Camps — amount", kind: "number" },
    { key: "collaborationCount", label: "13. Collaboration — number", kind: "number" },
    { key: "collaborationAmount", label: "13. Collaboration — amount", kind: "number" },
    { key: "floodFoodDriveCount", label: "14. Flood Food Drive — number", kind: "number" },
    { key: "floodFoodDriveAmount", label: "14. Flood Food Drive — amount", kind: "number" },
    { key: "totalCasesExceptMonthlyRashan", label: "15. Total No. of Cases (Except Monthly Rashan)", kind: "number" },
    { key: "totalDrives", label: "16. Total No. of drives", kind: "number" },
    { key: "campsCount", label: "17. Camps (Medical, Food) Numbers", kind: "number" },
    { key: "overallCasesPlusDrives", label: "18. Overall Number of Cases + Drives", kind: "number" },
    { key: "totalAmountTransferred", label: "19. Total Amount Transferred", kind: "number" },
    { key: "notes", label: "Any note or description", kind: "textarea" },
  ],
  reference: [
    { key: "referenceNumber", label: "Reference Number", kind: "text", required: true },
    { key: "description", label: "Reference Description or Details", kind: "textarea", required: true },
    { key: "date", label: "Date", kind: "date", required: true },
    { key: "notes", label: "Any note or description", kind: "textarea" },
  ],
};

export function docTypeLabel(type: DocType): string {
  return DOC_NAV.find((n) => n.type === type)?.title ?? type;
}
