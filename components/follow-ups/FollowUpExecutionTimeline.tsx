"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Inbox,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";

import { getApiErrorMessage } from "@/services/api-client";
import { getFollowUpExecutions, retryFollowUpStep } from "@/services/follow-up.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  ExecutionStatusBadge,
  isRetryableStatus,
  resolveExecutionStatus,
} from "./ExecutionStatusBadge";
import {
  ExecutionDetailAccordion,
  getChannel,
  getStepLabel,
} from "./ExecutionDetailAccordion";
import { RetryStepButton } from "./RetryStepButton";
import type {
  FollowUpExecution,
  FollowUpExecutionStatus,
} from "@/types/follow-up";

const PAGE_SIZE = 20;

const STATUS_OPTIONS: FollowUpExecutionStatus[] = [
  "PENDING",
  "RUNNING",
  "SUCCESS",
  "FAILED",
  "RETRYING",
  "SKIPPED",
];

function formatDateTime(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getChannelIcon(channel: string) {
  const normalised = channel.toUpperCase();

  if (["SMS", "WHATSAPP", "MESSAGE", "PHONE", "ZALO"].includes(normalised)) {
    return Phone;
  }

  if (normalised.includes("MAIL")) return Mail;

  return MessageSquare;
}

type Notice = { tone: "success" | "danger"; message: string };

type FollowUpExecutionTimelineProps = {
  /** Locks the timeline to one enrollment (Lead Detail tab / deep link). */
  enrollmentId?: string;
  title?: string;
};

export function FollowUpExecutionTimeline({
  enrollmentId,
  title = "Lịch sử thực hiện Follow-up",
}: FollowUpExecutionTimelineProps) {
  const queryClient = useQueryClient();
  const isLocked = Boolean(enrollmentId);

  const [searchEnrollmentId, setSearchEnrollmentId] = React.useState(
    enrollmentId ?? "",
  );
  const [statusFilter, setStatusFilter] = React.useState<
    "" | FollowUpExecutionStatus
  >("");
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);
  const [expandedIds, setExpandedIds] = React.useState<string[]>([]);
  const [retryingId, setRetryingId] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<Notice | null>(null);

  const activeEnrollmentId = enrollmentId ?? searchEnrollmentId.trim();

  const query = useQuery({
    queryKey: ["follow-up-executions", activeEnrollmentId, statusFilter],
    queryFn: () =>
      getFollowUpExecutions({
        enrollmentId: activeEnrollmentId || undefined,
        status: statusFilter || undefined,
      }),
  });

  const retryMutation = useMutation({
    mutationFn: retryFollowUpStep,
    onMutate: (execution) => setRetryingId(execution.id),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({
        queryKey: ["follow-up-executions"],
      });
      setNotice({ tone: "success", message: result.message });
    },
    onError: (error) => {
      setNotice({ tone: "danger", message: getApiErrorMessage(error) });
    },
    onSettled: () => setRetryingId(null),
  });

  const executions = query.data ?? [];
  const visibleExecutions = executions.slice(0, visibleCount);

  const groupedExecutions = React.useMemo(() => {
    const groups = new Map<string, FollowUpExecution[]>();

    for (const execution of visibleExecutions) {
      const current = groups.get(execution.enrollmentId);
      if (current) {
        current.push(execution);
      } else {
        groups.set(execution.enrollmentId, [execution]);
      }
    }

    return [...groups.entries()];
  }, [visibleExecutions]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-gray-500">
          Timeline các bước follow-up đã đăng ký và kết quả thực thi từ
          backend.
        </p>
      </div>

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
          <div className="flex flex-col gap-3 border-b border-[#edf0ee] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            {!isLocked ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  className="sm:w-72"
                  placeholder="Enrollment ID (để trống = tất cả)"
                  aria-label="Filter by enrollment ID"
                  value={searchEnrollmentId}
                  onChange={(event) => {
                    setSearchEnrollmentId(event.target.value);
                    setVisibleCount(PAGE_SIZE);
                  }}
                />
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                Enrollment:{" "}
                <span className="font-mono text-[#17221c]">{enrollmentId}</span>
              </p>
            )}

            <div className="flex items-center gap-2">
              <Select
                className="w-44"
                value={statusFilter}
                aria-label="Filter by status"
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as "" | FollowUpExecutionStatus,
                  )
                }
              >
                <option value="">Tất cả trạng thái</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>

              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Tải lại lịch sử"
                disabled={query.isFetching}
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
              Đang tải lịch sử follow-up…
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
                  Không tải được lịch sử follow-up
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
          ) : executions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
              <div className="rounded-xl bg-[#edf4ef] p-3 text-[#173b2b]">
                <Inbox className="size-5" />
              </div>
              <div>
                <p className="font-semibold text-[#17221c]">
                  Chưa có execution nào
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {activeEnrollmentId
                    ? "Enrollment này chưa chạy bước follow-up nào."
                    : "Chạy một follow-up step để execution xuất hiện ở đây."}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8 p-5">
              {groupedExecutions.map(([groupEnrollmentId, groupExecutions]) => (
                <section key={groupEnrollmentId} className="space-y-4">
                  {groupedExecutions.length > 1 ? (
                    <p className="break-all text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Enrollment: {groupEnrollmentId}
                    </p>
                  ) : null}

                  <ol className="relative space-y-4 border-l-2 border-[#e2e8e4] pl-6">
                    {groupExecutions.map((execution) => {
                      const status = resolveExecutionStatus(execution.status);
                      const channel = getChannel(execution);
                      const ChannelIcon = getChannelIcon(channel);
                      const isExpanded = expandedIds.includes(execution.id);
                      const isRetrying = retryingId === execution.id;
                      // Retry Step is only offered for a failed execution
                      // (FAILED = out of attempts, RETRYING = retry armed)
                      const canRetry = isRetryableStatus(status);

                      return (
                        <li key={execution.id} className="relative">
                          <span
                            className="absolute top-5 -left-[31px] flex size-3.5 items-center justify-center rounded-full border-2 border-white bg-[#173b2b]"
                            aria-hidden="true"
                          />

                          <div className="rounded-2xl border border-[#e2e8e4] bg-[#f6f8f7] p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-bold text-[#17221c]">
                                    {getStepLabel(execution)}
                                  </p>
                                  <Badge tone="neutral">
                                    <ChannelIcon />
                                    {channel}
                                  </Badge>
                                </div>

                                <p className="text-xs text-gray-500">
                                  {formatDateTime(execution.createdAt)}
                                </p>
                              </div>

                              <ExecutionStatusBadge status={status} />
                            </div>

                            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                              <div>
                                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                  Scheduled Time
                                </dt>
                                <dd className="mt-1 text-sm text-[#17221c]">
                                  {formatDateTime(execution.scheduledAt)}
                                </dd>
                              </div>

                              <div>
                                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                  Executed Time
                                </dt>
                                <dd className="mt-1 text-sm text-[#17221c]">
                                  {formatDateTime(
                                    execution.completedAt ?? execution.startedAt,
                                  )}
                                </dd>
                              </div>

                              <div>
                                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                  Retry Count
                                </dt>
                                <dd className="mt-1 text-sm text-[#17221c]">
                                  {execution.retryCount}
                                </dd>
                              </div>

                              <div>
                                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                  Step
                                </dt>
                                <dd className="mt-1 break-all font-mono text-xs text-[#17221c]">
                                  {execution.stepId}
                                </dd>
                              </div>
                            </dl>

                            {execution.errorMessage ? (
                              <div className="mt-4 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex items-start gap-2">
                                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-red-600" />
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                                      Error Message
                                    </p>
                                    <p className="mt-1 text-xs leading-relaxed break-words text-red-800">
                                      {execution.errorMessage}
                                    </p>
                                    <p className="mt-1 text-xs text-red-700">
                                      Retry Count: {execution.retryCount}
                                    </p>
                                  </div>
                                </div>

                                {canRetry ? (
                                  <RetryStepButton
                                    execution={execution}
                                    pending={isRetrying}
                                    onRetry={(target) =>
                                      retryMutation.mutate(target)
                                    }
                                  />
                                ) : null}
                              </div>
                            ) : null}

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              {canRetry && !execution.errorMessage ? (
                                <RetryStepButton
                                  execution={execution}
                                  pending={isRetrying}
                                  onRetry={(target) =>
                                    retryMutation.mutate(target)
                                  }
                                />
                              ) : null}
                            </div>

                            <div className="mt-3">
                              <ExecutionDetailAccordion
                                execution={execution}
                                open={isExpanded}
                                onToggle={() => toggleExpanded(execution.id)}
                              />
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              ))}

              {executions.length > visibleCount ? (
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setVisibleCount((previous) => previous + PAGE_SIZE)
                    }
                  >
                    Xem thêm ({executions.length - visibleCount})
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}