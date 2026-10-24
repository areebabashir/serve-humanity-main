import { api } from "@/lib/api";

export type ItSupportScope = "board" | "chapter";
export type ItSupportStatus = "open" | "closed";

export type ItSupportUser = {
  _id: string;
  name: string;
  email: string;
  systemRole?: string;
  chapterRole?: string;
};

export type ItSupportMessage = {
  _id: string;
  body: string;
  createdAt: string;
  sender: ItSupportUser | string;
};

export type ItSupportThread = {
  _id: string;
  subject: string;
  scope: ItSupportScope;
  status: ItSupportStatus;
  chapter?: { _id: string; name?: string; city?: string } | string | null;
  requester: ItSupportUser | string;
  messages: ItSupportMessage[];
  lastMessageAt: string;
  preview?: string;
  messageCount?: number;
  unread?: boolean;
  unreadForIt?: boolean;
  unreadForRequester?: boolean;
};

function unwrapList(res: { data?: ItSupportThread[] }) {
  return res.data || [];
}

export async function fetchMyItThreads() {
  const res = await api<{ success: true; data: ItSupportThread[] }>("/it-support/threads");
  return unwrapList(res);
}

export async function fetchItThread(id: string) {
  const res = await api<{ success: true; data: ItSupportThread }>(`/it-support/threads/${id}`);
  return res.data;
}

export async function createItThread(payload: { subject: string; body: string }) {
  const res = await api<{ success: true; data: ItSupportThread }>("/it-support/threads", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function replyItThread(id: string, body: string) {
  const res = await api<{ success: true; data: ItSupportThread }>(
    `/it-support/threads/${id}/replies`,
    { method: "POST", body: JSON.stringify({ body }) },
  );
  return res.data;
}

export async function setItThreadStatus(id: string, status: ItSupportStatus) {
  const res = await api<{ success: true; data: ItSupportThread }>(
    `/it-support/threads/${id}/status`,
    { method: "PATCH", body: JSON.stringify({ status }) },
  );
  return res.data;
}

export function senderName(sender: ItSupportMessage["sender"]) {
  if (!sender) return "Unknown";
  if (typeof sender === "string") return sender;
  return sender.name || sender.email || "Unknown";
}

export function requesterLabel(requester: ItSupportThread["requester"]) {
  if (!requester) return "Unknown";
  if (typeof requester === "string") return requester;
  return requester.name || requester.email || "Unknown";
}
