import { apiClient } from "./api-client";
import type {
  AppNotification,
  MarkAllReadResponse,
  NotificationQuery,
  UnreadCountResponse,
} from "@/types/notification";

/**
 * UC07 - In-app Notification Center API layer.
 *
 * Backend endpoints (NestJS NotificationsController, prefix /api/v1):
 *   GET   /notifications?userId&unreadOnly&limit -> Notification[]
 *   GET   /notifications/unread-count?userId     -> { count }
 *   PATCH /notifications/:id/read  { userId }    -> Notification
 *   PATCH /notifications/read-all   { userId }   -> { updated }
 *
 * The API has no authentication yet, so every call states which user's inbox
 * is being read.
 */

export async function getNotifications(
  query: NotificationQuery,
): Promise<AppNotification[]> {
  const response = await apiClient.get<AppNotification[]>("/notifications", {
    params: {
      userId: query.userId,
      ...(query.unreadOnly ? { unreadOnly: true } : {}),
      ...(query.limit ? { limit: query.limit } : {}),
    },
  });

  const body = response.data as
    | AppNotification[]
    | { data?: AppNotification[] }
    | null;

  if (Array.isArray(body)) return body;

  return (body as { data?: AppNotification[] } | null)?.data ?? [];
}

export async function getUnreadNotificationCount(
  userId: string,
): Promise<number> {
  const response = await apiClient.get<UnreadCountResponse>(
    "/notifications/unread-count",
    { params: { userId } },
  );

  return response.data?.count ?? 0;
}

export async function markNotificationRead(
  id: string,
  userId: string,
): Promise<AppNotification> {
  const response = await apiClient.patch<AppNotification>(
    `/notifications/${id}/read`,
    { userId },
  );

  return response.data;
}

export async function markAllNotificationsRead(
  userId: string,
): Promise<MarkAllReadResponse> {
  const response = await apiClient.patch<MarkAllReadResponse>(
    "/notifications/read-all",
    { userId },
  );

  return response.data;
}
