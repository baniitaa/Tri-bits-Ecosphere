import { apiRequest } from "@/lib/api";

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string | null;
  link?: string | null;
  createdAt: string;
  user?: { id: string; email: string; firstName: string; lastName: string } | null;
};

export const notificationsApi = {
  list: () => apiRequest<NotificationRow[]>("/notifications"),
  unreadCount: () => apiRequest<{ unreadCount: number }>("/notifications/unread-count"),
  markRead: (id: string) => apiRequest<null>(`/notifications/${id}/read`, { method: "POST" }),
  markAllRead: () => apiRequest<null>("/notifications/mark-all-read", { method: "POST" })
};
