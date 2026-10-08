"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardCheck,
  Inbox,
  Loader2,
  RefreshCw,
  Search,
  TriangleAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getApiErrorMessage } from "@/services/api-client";
import {
  assignReviewTask,
  getReviewTask,
  getReviewTasks,
} from "@/services/review.service";
import { useWorkspaceUser } from "@/components/notifications/useWorkspaceUser";
import { ReviewTaskCard } from "./ReviewTaskCard";
import { ReviewTaskDrawer } from "./ReviewTaskDrawer";
import {
  REVIEW_STATUS_OPTIONS,
  collectReviewers,
  sortReviewTasksByPriority,
} from "./review-utils";
import type { ReviewStatus, ReviewTask } from "@/types/review";

const UNASSIGNED = "__unassigned__";
const CURRENT_USER = "__current_user__";

type Notice = { tone: "success" | "danger"; message: string };

type ReviewInboxProps = {
  /** Task opened from the URL (`?task=<id>`) so notifications can deep-link. */
  taskId: string | null;
  onTaskIdChange: (taskId: string | null) => void;
};

export function ReviewInbox({ taskId, onTaskIdChange }: ReviewInboxProps) {
  const queryClient = useQueryClient();

  const { activeUser } = useWorkspaceUser();

  const [statusFilter, setStatusFilter] = React.useState<
    "" | ReviewStatus
  >("");
  const [reviewerFilter, setReviewerFilter] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [claimingId, setClaimingId] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<Notice | null>(null);

  const query = useQuery({
    queryKey: ["review-tasks"],
    queryFn: getReviewTasks,
  });

  const claimMutation = useMutation({
    mutationFn: async (input: { task: ReviewTask; reviewerId: string }) => {
      await assignReviewTask(input.task.id, { reviewerId: input.reviewerId });

      // The assign endpoint echoes a stale body, so re-read the task.
      const updated = await getReviewTask(input.task.id);

      return { updated, reviewerId: input.reviewerId };
    },
    onMutate: (input) => setClaimingId(input.task.id),
    onSuccess: async ({ updated, reviewerId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["review-tasks"] }),
        queryClient.invalidateQueries({ queryKey: ["review-task", updated.id] }),
      ]);

      const reviewerName =
        updated.assignee?.name ??
        query.data?.find((task) => task.id === updated.id)?.assignee?.name ??
        reviewerId;

      setNotice({
        tone: "success",
        message: `Đã phân công task cho ${reviewerName}.`,
      });
    },
    onError: (error) => {
      setNotice({ tone: "danger", message: getApiErrorMessage(error) });
    },
    onSettled: () => setClaimingId(null),
  });

  const tasks = React.useMemo(() => query.data ?? [], [query.data]);
  const reviewers = React.useMemo(() => collectReviewers(tasks), [tasks]);

  const visibleTasks = React.useMemo(() => {
    const currentUserId = activeUser?.id ?? null;

    const filtered = tasks.filter((task) => {
      if (statusFilter && task.status !== statusFilter) return false;

      if (!reviewerFilter) return true;
      if (reviewerFilter === UNASSIGNED) return !task.assignedTo;
      if (reviewerFilter === CURRENT_USER) return currentUserId ? task.assignedTo === currentUserId : false;

      return task.assignedTo === reviewerFilter;
    });

    if (searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase().trim();
      return sortReviewTasksByPriority(
        filtered.filter((task) => {
          const lead = task.lead;
          const leadName = lead
            ? `${lead.firstName} ${lead.lastName ?? ""}`.toLowerCase()
            : "";
          const leadEmail = lead?.email?.toLowerCase() ?? "";
          const taskId = task.id.toLowerCase();

          return (
            leadName.includes(queryLower) ||
            leadEmail.includes(queryLower) ||
            taskId.includes(queryLower)
          );
        }),
      );
    }

    return sortReviewTasksByPriority(filtered);
  }, [tasks, statusFilter, reviewerFilter, searchQuery, activeUser?.id]);

  const pendingCount = tasks.filter((task) => task.status === "PENDING").length;
  const inReviewCount = tasks.filter(
    (task) => task.status === "IN_REVIEW",
  ).length;
  const resolvedCount = tasks.filter(
    (task) => task.status === "RESOLVED",
  ).length;

  return (
    <div className="space-y-4">
      {notice ? (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            notice.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {notice.message}
        </div>
      ) : null}

      <Card>
        <CardContent className="space-y-4 p-0">
          <div className="flex flex-col gap-4 border-b border-[#edf0ee] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="warning">CHỜ: {pendingCount}</Badge>
              <Badge tone="info">ĐANG REVIEW: {inReviewCount}</Badge>
              <Badge tone="success">ĐÃ XỬ LÝ: {resolvedCount}</Badge>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center w-full lg:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <Input
                  className="pl-9 h-9 text-xs"
                  placeholder="Tìm theo tên lead, email, task ID…"
                  aria-label="Tìm kiếm review task"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>

              <Select
                className="sm:w-44"
                aria-label="Lọc theo trạng thái"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "" | ReviewStatus)
                }
              >
                <option value="">Tất cả trạng thái</option>
                {REVIEW_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>

              <Select
                className="sm:w-52"
                aria-label="Lọc theo reviewer"
                value={reviewerFilter}
                onChange={(event) => setReviewerFilter(event.target.value)}
              >
                <option value="">Tất cả reviewer</option>
                <option value={UNASSIGNED}>Chưa phân công</option>
                {activeUser ? (
                  <option value={CURRENT_USER}>Người dùng hiện tại ({activeUser.name})</option>
                ) : (
                  <option value={CURRENT_USER} disabled>Người dùng hiện tại (chưa chọn)</option>
                )}
                {reviewers.map((reviewer) => (
                  <option key={reviewer.id} value={reviewer.id}>
                    {reviewer.name}
                  </option>
                ))}
              </Select>

              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Tải lại danh sách review"
                onClick={() => query.refetch()}
              >
                <RefreshCw className={query.isFetching ? "animate-spin" : ""} />
              </Button>
            </div>
          </div>

          {query.isLoading ? (
            <div
              className="flex items-center justify-center gap-3 px-5 py-14 text-sm text-gray-500"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="size-5 animate-spin text-[#173b2b]" />
              Đang tải review inbox…
            </div>
          ) : query.isError ? (
            <div
              className="flex flex-col items-center gap-3 px-5 py-14 text-center"
              role="alert"
            >
              <div className="rounded-xl bg-red-50 p-3 text-red-600">
                <TriangleAlert className="size-5" />
              </div>
              <div>
                <p className="font-semibold text-[#17221c]">
                  Không tải được review inbox
                </p>
                <p className="mt-1 max-w-md text-sm text-gray-500">
                  {getApiErrorMessage(query.error)}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => query.refetch()}
              >
                Thử lại
              </Button>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
              <div className="rounded-xl bg-[#edf4ef] p-3 text-[#173b2b]">
                <Inbox className="size-5" />
              </div>
              <div>
                <p className="font-semibold text-[#17221c]">
                  Chưa có review task nào
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Task sẽ xuất hiện khi AI cần người xác nhận kết quả.
                </p>
              </div>
            </div>
          ) : visibleTasks.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
              <div className="rounded-xl bg-[#edf4ef] p-3 text-[#173b2b]">
                <ClipboardCheck className="size-5" />
              </div>
              <div>
                <p className="font-semibold text-[#17221c]">
                  Không có task khớp bộ lọc
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Thử đổi trạng thái, reviewer hoặc từ khóa tìm kiếm.
                </p>
              </div>
            </div>
          ) : (
            <ul className="space-y-4 p-5">
              {visibleTasks.map((task) => (
                <li key={task.id}>
                  <ReviewTaskCard
                    task={task}
                    onOpen={(target) => onTaskIdChange(target.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {taskId ? (
        <ReviewTaskDrawer
          taskId={taskId}
          reviewers={reviewers}
          claiming={claimingId === taskId}
          onClaim={(target, reviewerId) =>
            claimMutation.mutate({ task: target, reviewerId })
          }
          onClose={() => onTaskIdChange(null)}
        />
      ) : null}
    </div>
  );
}
