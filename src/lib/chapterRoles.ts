/**
 * Chapter dashboard hierarchy:
 * President (Male) / Vice President (Female) / Vice President (Male)
 *   → Cabinet Members (Finance, Ops, Verification, Documentation, Media)
 *     → Directors (team collection)
 *       → Members
 */

export type ChapterRole =
  | "president"
  | "vice_president"
  | "vice_president_male"
  | "finance_head"
  | "operations_head"
  | "verification_head"
  | "documentation_head"
  | "hr_head"
  | "media_head"
  | "it_head"
  | "fundraising_head"
  | "event_head"
  | "director"
  | "assistant_director"
  | "member";

export const CHAPTER_ROLE_LABEL: Record<ChapterRole, string> = {
  president: "President (Male)",
  vice_president: "Vice President (Female)",
  vice_president_male: "Vice President (Male)",
  finance_head: "Cabinet — Finance",
  operations_head: "Cabinet — Operations",
  verification_head: "Cabinet — Verification",
  documentation_head: "Cabinet — Documentation",
  media_head: "Cabinet — Media & Graphics",
  hr_head: "Member",
  it_head: "Member",
  fundraising_head: "Member",
  event_head: "Member",
  director: "Director",
  assistant_director: "Assistant Director",
  member: "Member",
};

/** Teams shown on public registration */
export const JOINABLE_TEAMS: { value: ChapterRole; label: string }[] = [
  { value: "verification_head", label: "Verification" },
  { value: "operations_head", label: "Operations" },
  { value: "documentation_head", label: "Documentation" },
  { value: "finance_head", label: "Finance" },
  { value: "media_head", label: "Media & Graphics" },
];

/** Cabinet seats under President / VP */
export const CABINET_ROLES: ChapterRole[] = [
  "operations_head",
  "verification_head",
  "media_head",
  "finance_head",
  "documentation_head",
];

/** @deprecated alias for CABINET_ROLES */
export const TEAM_HEAD_ROLES = CABINET_ROLES;

export const VP_ROLES: ChapterRole[] = ["vice_president", "vice_president_male"];

/** Roles president / VP can create (VP + cabinet seats). IT is org-wide on CEO dashboard. */
export const CABINET_ASSIGNABLE_ROLES: ChapterRole[] = [...VP_ROLES, ...CABINET_ROLES];

/** @deprecated use CABINET_ASSIGNABLE_ROLES */
export const DIRECTOR_ASSIGNABLE_ROLES = CABINET_ASSIGNABLE_ROLES;
/** @deprecated */
export const PRESIDENT_ASSIGNABLE_ROLES = CABINET_ASSIGNABLE_ROLES;

export function isCabinetRole(role: string | null | undefined): boolean {
  return Boolean(role && (CABINET_ROLES as string[]).includes(role));
}

export function isVicePresidentRole(role: string | null | undefined): boolean {
  return Boolean(role && (VP_ROLES as string[]).includes(role));
}

/** @deprecated use isCabinetRole */
export function isTeamHeadRole(role: string | null | undefined): boolean {
  return isCabinetRole(role);
}

export function isTeamDirectorRole(role: string | null | undefined): boolean {
  return role === "director";
}

export function isValidTeamLeadRole(role: string | null | undefined): boolean {
  return isTeamDirectorRole(role) || isCabinetRole(role);
}

/** President / VP — personal donations only, no team. */
export function isOwnCollectionRole(role: string | null | undefined): boolean {
  return role === "president" || isVicePresidentRole(role);
}

export function canAssignChapterRoles(user: {
  systemRole?: string;
  chapterRole?: string | null;
} | null | undefined): boolean {
  if (!user) return false;
  if (user.systemRole === "president" || user.chapterRole === "president") return true;
  return isVicePresidentRole(user.chapterRole);
}

export function canManageCabinetTeam(user: {
  systemRole?: string;
  chapterRole?: string | null;
} | null | undefined): boolean {
  if (!user) return false;
  return isCabinetRole(user.chapterRole);
}

export function canReviewJoinRequests(user: {
  systemRole?: string;
  chapterRole?: string | null;
} | null | undefined): boolean {
  if (!user) return false;
  if (user.systemRole === "president" || user.chapterRole === "president") return true;
  if (isVicePresidentRole(user.chapterRole)) return true;
  return isCabinetRole(user.chapterRole);
}

const LEADERSHIP_MODULES = [
  "overview",
  "my-donation",
  "director-donations",
  "team",
  "events",
  "finance",
  "ops",
  "verification",
  "operations",
  "media",
  "documentation",
  "case-registrations",
  "reports",
  "notifications",
  "contact-it",
  "profile",
] as const;

const CABINET_BASE = [
  "overview",
  "team",
  "team-collection",
  "notifications",
  "contact-it",
  "profile",
] as const;

const MEMBER_BASE = ["my-donation", "notifications", "contact-it", "profile"] as const;

/** Modules a role can open (read). Directors + cabinet heads get team-collection. */
export const CHAPTER_MODULES: Record<ChapterRole, string[]> = {
  president: [...LEADERSHIP_MODULES],
  vice_president: [...LEADERSHIP_MODULES],
  vice_president_male: [...LEADERSHIP_MODULES],
  director: ["overview", "team-collection", "notifications", "contact-it", "profile"],
  finance_head: [
    ...CABINET_BASE,
    "finance",
    "director-donations",
  ],
  operations_head: [...CABINET_BASE, "ops", "operations", "director-donations"],
  verification_head: [...CABINET_BASE, "ops", "verification", "director-donations", "case-registrations"],
  documentation_head: [...CABINET_BASE, "documentation", "director-donations", "case-registrations"],
  media_head: [...CABINET_BASE, "media", "director-donations"],
  it_head: [...MEMBER_BASE],
  hr_head: [...MEMBER_BASE],
  fundraising_head: [...MEMBER_BASE],
  event_head: [...MEMBER_BASE],
  assistant_director: [...MEMBER_BASE],
  member: [...MEMBER_BASE],
};

/** Modules a role can write. */
export const CHAPTER_WRITE: Record<ChapterRole, string[]> = {
  president: [...LEADERSHIP_MODULES],
  vice_president: [...LEADERSHIP_MODULES],
  vice_president_male: [...LEADERSHIP_MODULES],
  director: ["team-collection", "contact-it"],
  finance_head: ["team", "team-collection", "finance", "director-donations", "contact-it"],
  operations_head: ["team", "team-collection", "operations", "ops", "director-donations", "contact-it"],
  verification_head: ["team", "team-collection", "verification", "ops", "case-registrations", "director-donations", "contact-it"],
  documentation_head: ["team", "team-collection", "documentation", "case-registrations", "director-donations", "contact-it"],
  media_head: ["team", "team-collection", "media", "director-donations", "contact-it"],
  it_head: ["my-donation", "contact-it"],
  hr_head: ["my-donation", "contact-it"],
  fundraising_head: ["my-donation", "contact-it"],
  event_head: ["my-donation", "contact-it"],
  assistant_director: ["my-donation", "contact-it"],
  member: ["my-donation", "contact-it"],
};

export function resolveChapterRole(user: {
  systemRole?: string;
  chapterRole?: string | null;
}): ChapterRole {
  const cr = user.chapterRole as ChapterRole | undefined;
  if (cr && cr in CHAPTER_ROLE_LABEL) return cr;
  if (user.systemRole === "president") return "president";
  return "member";
}

export function isChapterPresident(user: {
  systemRole?: string;
  chapterRole?: string | null;
} | null | undefined): boolean {
  if (!user) return false;
  return user.systemRole === "president" || user.chapterRole === "president";
}

export const MODULE_FOR_CABINET_ROLE: Record<string, string> = {
  finance_head: "finance",
  operations_head: "operations",
  verification_head: "verification",
  documentation_head: "documentation",
  media_head: "media",
};

export const MODULE_CHAPTER_ROUTE: Record<string, string> = {
  finance: "finance",
  operations: "operations",
  verification: "verification",
  documentation: "documentation",
  media: "media",
};

/** Team module a user belongs to (cabinet seat or assigned cabinet). */
export function teamModuleForUser(user: {
  chapterRole?: string | null;
  cabinetMember?: string | { _id?: string; chapterRole?: string } | null;
} | null | undefined): string | null {
  if (!user) return null;
  const fromRole = MODULE_FOR_CABINET_ROLE[user.chapterRole || ""];
  if (fromRole) return fromRole;
  const cm = user.cabinetMember;
  if (cm && typeof cm === "object" && cm.chapterRole) {
    return MODULE_FOR_CABINET_ROLE[cm.chapterRole] || null;
  }
  return null;
}

export function isCabinetForModuleUser(
  user: { chapterRole?: string | null } | null | undefined,
  module: string,
): boolean {
  if (!user?.chapterRole) return false;
  return MODULE_FOR_CABINET_ROLE[user.chapterRole] === module;
}

export function chapterHomeForUser(user: {
  systemRole?: string;
  chapterRole?: string | null;
  cabinetMember?: string | { _id?: string; chapterRole?: string } | null;
}): string {
  const teamMod = teamModuleForUser(user);
  if (teamMod && MODULE_CHAPTER_ROUTE[teamMod]) {
    return `/chapter/${MODULE_CHAPTER_ROUTE[teamMod]}`;
  }
  return CHAPTER_ROLE_HOME[resolveChapterRole(user)];
}

export function canAccessChapterModuleForUser(
  user: {
    systemRole?: string;
    chapterRole?: string | null;
    cabinetMember?: string | { _id?: string; chapterRole?: string } | null;
  } | null | undefined,
  module: string,
): boolean {
  if (!user) return false;
  const role = resolveChapterRole(user);
  if (canAccessChapterModule(role, module)) return true;
  return teamModuleForUser(user) === module;
}

export function canWriteChapterModuleForUser(
  user: {
    systemRole?: string;
    chapterRole?: string | null;
    cabinetMember?: string | { _id?: string; chapterRole?: string } | null;
  } | null | undefined,
  module: string,
): boolean {
  if (!user) return false;
  const role = resolveChapterRole(user);
  if (canWriteChapterModule(role, module)) return true;
  return teamModuleForUser(user) === module;
}

export function canAccessChapterModule(role: ChapterRole, module: string): boolean {
  const mods = CHAPTER_MODULES[role] ?? [];
  return mods.includes("*") || mods.includes(module);
}

export function canWriteChapterModule(role: ChapterRole, module: string): boolean {
  const mods = CHAPTER_WRITE[role] ?? [];
  return mods.includes("*") || mods.includes(module);
}

export function isChapterLeadership(role: ChapterRole): boolean {
  return role === "president" || isVicePresidentRole(role) || isCabinetRole(role);
}

/** Chapter Drive upload for documentation: president, VPs, or Documentation cabinet head. */
export function canUploadDocumentationToDrive(user: {
  systemRole?: string;
  chapterRole?: string | null;
} | null | undefined): boolean {
  if (!user) return false;
  const sys = user.systemRole || "";
  if (
    sys === "ceo" ||
    sys === "founder" ||
    sys === "cto" ||
    sys === "coo" ||
    sys === "bog_documentation" ||
    sys === "president"
  ) {
    return true;
  }
  if (user.chapterRole === "president" || isVicePresidentRole(user.chapterRole)) return true;
  return user.chapterRole === "documentation_head";
}

export function isChapterAppUser(systemRole: string | undefined | null): boolean {
  return systemRole === "president" || systemRole === "member";
}

export function isPlainMember(role: ChapterRole): boolean {
  return (
    role === "member" ||
    role === "assistant_director" ||
    role === "hr_head" ||
    role === "fundraising_head" ||
    role === "event_head"
  );
}

/** Home path after login inside /chapter */
export const CHAPTER_ROLE_HOME: Record<ChapterRole, string> = {
  president: "/chapter",
  vice_president: "/chapter",
  vice_president_male: "/chapter",
  director: "/chapter/team-collection",
  finance_head: "/chapter/director-donations",
  operations_head: "/chapter/operations",
  verification_head: "/chapter/verification",
  documentation_head: "/chapter/documentation",
  media_head: "/chapter/media-cases",
  it_head: "/chapter/my-donation",
  hr_head: "/chapter/my-donation",
  fundraising_head: "/chapter/my-donation",
  event_head: "/chapter/my-donation",
  assistant_director: "/chapter/my-donation",
  member: "/chapter/my-donation",
};

export function chapterHomeForUserLegacy(role: ChapterRole): string {
  return CHAPTER_ROLE_HOME[role];
}

/** @deprecated use chapterHomeForUser with full user object */
export function chapterHomeForRole(user: {
  systemRole?: string;
  chapterRole?: string | null;
}): string {
  return CHAPTER_ROLE_HOME[resolveChapterRole(user)];
}

export function idOfRef(
  ref?: string | { _id?: string } | null,
): string | null {
  if (!ref) return null;
  if (typeof ref === "string") return ref;
  return ref._id || null;
}
