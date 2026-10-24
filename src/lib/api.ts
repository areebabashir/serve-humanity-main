const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export type SystemRole =
  | "ceo"
  | "founder"
  | "cto"
  | "coo"
  | "bog_verification"
  | "bog_operations"
  | "bog_media"
  | "bog_finance"
  | "bog_documentation"
  | "bog_it"
  | "president"
  | "member"
  | "public";

export type AuthChapter = string | { _id: string; name?: string; city?: string } | null;

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  systemRole: SystemRole;
  chapterRole?: string;
  chapter?: AuthChapter;
  teamDirector?: string | { _id: string; name?: string; email?: string; chapterRole?: string } | null;
  cabinetMember?: string | { _id: string; name?: string; email?: string; chapterRole?: string } | null;
  requestedCabinetRole?: string | null;
  membershipStatus?: string;
  avatar?: string;
  phone?: string;
  isActive?: boolean;
}

export function chapterIdFromUser(user: { chapter?: AuthChapter } | null | undefined): string | null {
  if (!user?.chapter) return null;
  if (typeof user.chapter === "string") return user.chapter;
  return user.chapter._id || null;
}

type ApiError = { success: false; message: string };

export class ApiRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getToken(): string | null {
  return localStorage.getItem("sh_token");
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem("sh_token", token);
  else localStorage.removeItem("sh_token");
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = (data as ApiError).message || `Request failed (${res.status})`;
    throw new ApiRequestError(message, res.status);
  }

  return data as T;
}
