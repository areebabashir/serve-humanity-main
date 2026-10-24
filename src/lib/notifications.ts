import { api } from "./api";

export type NotificationPriority = "normal" | "high" | "urgent";

export interface InboxNotification {
  _id: string;
  title: string;
  body: string;
  priority: NotificationPriority;
  audience?: string;
  createdBy?: { _id: string; name: string; email: string } | null;
  createdAt: string;
  expiresAt?: string | null;
  readAt?: string | null;
}

export async function fetchInbox() {
  const res = await api<{ success: true; data: InboxNotification[] }>("/notifications/inbox");
  return res.data;
}

export async function fetchUnreadCount() {
  const res = await api<{ success: true; data: { count: number } }>("/notifications/unread-count");
  return res.data.count;
}

export async function markNotificationRead(id: string) {
  return api<{ success: true; data: { _id: string; readAt: string } }>(
    `/notifications/${id}/read`,
    { method: "PATCH" },
  );
}

/** Remove from this user's inbox only. */
export async function dismissNotification(id: string) {
  return api<{ success: true; message?: string }>(`/notifications/${id}/inbox`, {
    method: "DELETE",
  });
}
