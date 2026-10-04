/**
 * In-app notification contracts (UC07).
 * Shapes mirror NotificationsController - src/modules/notifications.
 */

/**
 * `NotificationType` enum. HUMAN_REVIEW_REQUIRED is emitted by UC07 when a
 * review task is assigned; FOLLOW_UP_FAILED is reserved for UC06 execute
 * follow-up and is not emitted by the API yet.
 */
export type NotificationType = "HUMAN_REVIEW_REQUIRED" | "FOLLOW_UP_FAILED";

export type AppNotification = {
  id: string;
  userId: string;
  type: NotificationType | string;
  title: string;
  content: string | null;
  leadId: string | null;
  customerId: string | null;
  reviewTaskId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};

export type NotificationQuery = {
  userId: string;
  unreadOnly?: boolean;
  limit?: number;
};

export type UnreadCountResponse = { count: number };

export type MarkAllReadResponse = { updated: number };
