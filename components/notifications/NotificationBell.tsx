"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellRing,
  CheckCheck,
  ClipboardCheck,
  Inbox,
  Loader2,
  RefreshCw,
  TriangleAlert,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { getApiErrorMessage } from "@/services/api-client";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notification.service";
import { useWorkspaceUser } from "./useWorkspaceUser";
import type { AppNotification } from "@/types/notification";

const PANEL_LIMIT = 20;

type Notice = { tone: "success" | "danger"; message: string };

type NotificationVisual = {
  label: string;
  icon: LucideIcon;
  tone: "info" | "danger";
};

const NOTIFICATION_VISUALS: Record<string, NotificationVisual> = {
  HUMAN_REVIEW_REQUIRED: {
    label: "Review task mới",
    icon: ClipboardCheck,
    tone: "info",
  },
  FOLLOW_UP_FAILED: {
    label: "Follow-up thất bại",
    icon: Workflow,
    tone: "danger",
  },
};

const relativeFormatter = new Intl.RelativeTimeFormat("vi", {
  numeric: "auto",
});

function formatRelativeTime(value: string): string {
  const time = new Date(value).getTime();

  if (Number.isNaN(time)) return "—";

  const diffSeconds = Math.round((time - Date.now()) / 1000);
  const diffMinutes = Math.round(diffSeconds / 60);

  if (Math.abs(diffMinutes) < 60) {
    return relativeFormatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (Math.abs(diffHours) < 24) {
    return relativeFormatter.format(diffHours, "hour");
  }

  return relativeFormatter.format(Math.round(diffHours / 24), "day");
}

/** Deep link for a notification; review notifications open the task drawer. */
function getNotificationHref(notification: AppNotification): string | null {
  if (notification.reviewTaskId) {
    return `/review?task=${notification.reviewTaskId}`;
  }

  if (notification.type === "FOLLOW_UP_FAILED") {
    return "/follow-ups";
  }

  return null;
}

export function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [open, setOpen] = React.useState(false);
  const [notice, setNotice] = React.useState<Notice | null>(null);
  const { users, activeUser, selectUser, isLoading: usersLoading } =
    useWorkspaceUser();

  const userId = activeUser?.id ?? null;

  const requireUserId = (): string => {
    if (!userId) {
      throw new Error("Chưa có tài khoản workspace để đọc thông báo.");
    }

    return userId;
  };

  const countQuery = useQuery({
    queryKey: ["notification-unread-count", userId],
    queryFn: () => getUnreadNotificationCount(requireUserId()),
    enabled: Boolean(userId),
    refetchInterval: 60_000,
  });

  const listQuery = useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => getNotifications({ userId: requireUserId(), limit: PANEL_LIMIT }),
    enabled: Boolean(userId) && open,
  });

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationRead(notificationId, requireUserId()),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", userId] });

      const previous = queryClient.getQueryData<AppNotification[]>([
        "notifications",
        userId,
      ]);

      queryClient.setQueryData<AppNotification[]>(
        ["notifications", userId],
        (current) =>
          current?.map((notification) =>
            notification.id === notificationId
              ? { ...notification, isRead: true }
              : notification,
          ) ?? current,
      );

      return { previous };
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
      setNotice({ tone: "danger", message: getApiErrorMessage(error) });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-unread-count", userId] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(requireUserId()),
    onSuccess: async ({ updated }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notifications", userId] }),
        queryClient.invalidateQueries({
          queryKey: ["notification-unread-count", userId],
        }),
      ]);

      setNotice({
        tone: "success",
        message: `Đã đánh dấu ${updated} thông báo là đã đọc.`,
      });
    },
    onError: (error) => {
      setNotice({ tone: "danger", message: getApiErrorMessage(error) });
    },
  });

  React.useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const unreadCount = countQuery.data ?? 0;
  const notifications = listQuery.data ?? [];
  const hasUnread = notifications.some((notification) => !notification.isRead);

  const handleNotificationClick = (notification: AppNotification) => {
    setNotice(null);

    if (!notification.isRead) {
      markReadMutation.mutate(notification.id);
    }

    const href = getNotificationHref(notification);

    setOpen(false);

    if (href) {
      router.push(href);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label={
          unreadCount > 0
            ? `Thông báo, ${unreadCount} chưa đọc`
            : "Thông báo, không có thông báo chưa đọc"
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((previous) => !previous)}
        className="relative flex size-10 items-center justify-center rounded-xl border border-[#e2e8e4] bg-white text-[#17221c] transition hover:bg-[#f0f4f1]"
      >
        {unreadCount > 0 ? (
          <BellRing className="size-5 text-[#173b2b]" />
        ) : (
          <Bell className="size-5" />
        )}

        {unreadCount > 0 ? (
          <span className="absolute -top-1.5 -right-1.5 flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Trung tâm thông báo"
          className="absolute right-0 z-50 mt-2 flex max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[#e2e8e4] bg-white shadow-xl"
        >
          <div className="space-y-3 border-b border-[#edf0ee] px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold">Thông báo</p>
                <p className="text-xs text-gray-500">
                  {unreadCount > 0 ? `${unreadCount} chưa đọc` : "Đã đọc hết"}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Tải lại thông báo"
                  onClick={() => listQuery.refetch()}
                >
                  <RefreshCw
                    className={listQuery.isFetching ? "animate-spin" : ""}
                  />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Đánh dấu đã đọc tất cả"
                  disabled={!hasUnread || markAllMutation.isPending}
                  onClick={() => markAllMutation.mutate()}
                >
                  {markAllMutation.isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <CheckCheck />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select
                className="h-9 text-xs"
                aria-label="Chọn tài khoản xem thông báo"
                value={activeUser?.id ?? ""}
                disabled={usersLoading}
                onChange={(event) => selectUser(event.target.value)}
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} · {user.email}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {notice ? (
            <div
              role="status"
              aria-live="polite"
              className={`border-b px-4 py-2 text-xs font-medium ${
                notice.tone === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {notice.message}
            </div>
          ) : null}

          <div className="flex-1 overflow-y-auto">
            {listQuery.isLoading ? (
              <div
                className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-gray-500"
                role="status"
                aria-live="polite"
              >
                <Loader2 className="size-4 animate-spin text-[#173b2b]" />
                Đang tải thông báo…
              </div>
            ) : listQuery.isError ? (
              <div className="space-y-3 px-4 py-8 text-center" role="alert">
                <TriangleAlert className="mx-auto size-5 text-red-600" />
                <p className="text-sm font-semibold">Không tải được thông báo</p>
                <p className="text-xs text-gray-500">
                  {getApiErrorMessage(listQuery.error)}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => listQuery.refetch()}
                >
                  Thử lại
                </Button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <div className="rounded-xl bg-[#edf4ef] p-3 text-[#173b2b]">
                  <Inbox className="size-5" />
                </div>
                <p className="text-sm font-semibold text-[#17221c]">
                  Chưa có thông báo
                </p>
                <p className="text-xs text-gray-500">
                  Thông báo review task sẽ xuất hiện ở đây.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[#f1f4f2]">
                {notifications.map((notification) => {
                  const visual =
                    NOTIFICATION_VISUALS[notification.type] ??
                    ({
                      label: "Thông báo",
                      icon: Bell,
                      tone: "info",
                    } as NotificationVisual);
                  const Icon = visual.icon;
                  const href = getNotificationHref(notification);

                  return (
                    <li key={notification.id}>
                      <button
                        type="button"
                        onClick={() => handleNotificationClick(notification)}
                        aria-label={`${notification.title}. ${
                          notification.isRead ? "Đã đọc" : "Chưa đọc"
                        }`}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-[#f6f8f7] ${
                          notification.isRead ? "opacity-70" : ""
                        }`}
                      >
                        <Badge tone={visual.tone} className="shrink-0">
                          <Icon />
                          {visual.label}
                        </Badge>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            <p className="flex-1 text-sm font-semibold break-words text-[#17221c]">
                              {notification.title}
                            </p>
                            {!notification.isRead ? (
                              <span
                                className="mt-1.5 size-2 shrink-0 rounded-full bg-[#173b2b]"
                                aria-hidden="true"
                              />
                            ) : null}
                          </div>

                          {notification.content ? (
                            <p className="mt-1 text-xs leading-relaxed break-words text-gray-600">
                              {notification.content}
                            </p>
                          ) : null}

                          <p className="mt-1 text-[11px] text-gray-400">
                            {formatRelativeTime(notification.createdAt)}
                            {href ? " · Mở chi tiết" : ""}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
