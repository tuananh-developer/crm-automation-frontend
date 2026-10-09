"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  Building2,
  CirclePlay,
  Loader2,
  Mail,
  Phone,
  Save,
  TriangleAlert,
  UserRound,
  Workflow,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/services/api-client";
import {
  getLatestLeadQualification,
  getReviewTask,
  resolveReviewTask,
  startReviewTask,
} from "@/services/review.service";
import { ClaimReviewTaskButton } from "./ClaimReviewTaskButton";
import {
  ReviewDecisionBadge,
  ReviewStatusBadge,
} from "./ReviewStatusBadge";
import {
  LEAD_STATUS_BY_DECISION,
  REVIEW_DECISION_CONFIG,
  decisionRequiresComment,
  formatDateTime,
  getLeadName,
} from "./review-utils";
import type {
  ReviewDecision,
  ReviewReviewer,
  ReviewTask,
} from "@/types/review";

const DECISIONS: ReviewDecision[] = ["APPROVE", "REJECT", "MODIFY"];

type Notice = { tone: "success" | "danger"; message: string };

type ReviewTaskDrawerProps = {
  taskId: string;
  reviewers: ReviewReviewer[];
  claiming: boolean;
  onClaim: (task: ReviewTask, reviewerId: string) => void;
  onClose: () => void;
};

function stringify(value: unknown): string {
  if (value === null || value === undefined) return "—";

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function ReviewTaskDrawer({
  taskId,
  reviewers,
  claiming,
  onClaim,
  onClose,
}: ReviewTaskDrawerProps) {
  const queryClient = useQueryClient();
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const submittingRef = React.useRef(false);

  const [decision, setDecision] = React.useState<ReviewDecision | null>(null);
  const [comment, setComment] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<Notice | null>(null);

  const detailQuery = useQuery({
    queryKey: ["review-task", taskId],
    queryFn: () => getReviewTask(taskId),
  });

  const leadId = detailQuery.data?.leadId;

  const qualificationQuery = useQuery({
    queryKey: ["lead-qualification", leadId ?? ""],
    queryFn: () => getLatestLeadQualification(leadId ?? ""),
    enabled: Boolean(leadId),
  });

  const task = detailQuery.data;
  const qualification = qualificationQuery.data ?? null;

  const resolveMutation = useMutation({
    mutationFn: async (input: {
      taskId: string;
      decision: ReviewDecision;
      reviewComment?: string;
      needsStart: boolean;
    }) => {
      if (input.needsStart) {
        await startReviewTask(input.taskId);
      }

      return resolveReviewTask(input.taskId, {
        decision: input.decision,
        reviewComment: input.reviewComment,
      });
    },
    onSuccess: async (updated, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["review-tasks"] }),
        queryClient.invalidateQueries({ queryKey: ["review-task", updated.id] }),
      ]);

      setDecision(null);
      setComment("");
      setFormError(null);
      setNotice({
        tone: "success",
        message: `Đã ghi nhận quyết định ${REVIEW_DECISION_CONFIG[variables.decision].label}. Trạng thái lead: ${LEAD_STATUS_BY_DECISION[variables.decision]}.`,
      });
    },
    onError: (error) => {
      setNotice({ tone: "danger", message: getApiErrorMessage(error) });
    },
    onSettled: () => {
      submittingRef.current = false;
    },
  });

  React.useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!task) return;

    if (submittingRef.current || resolveMutation.isPending) return;

    if (!decision) {
      setFormError("Vui lòng chọn DUYỆT, TỪ CHỐI hoặc CHỈNH SỬA.");
      return;
    }

    if (decisionRequiresComment(decision) && !comment.trim()) {
      setFormError("Nhận xét của reviewer là bắt buộc với TỪ CHỐI / CHỈNH SỬA.");
      return;
    }

    if (!task.assignedTo) {
      setFormError("Task chưa có reviewer. Hãy nhận task trước khi gửi quyết định.");
      return;
    }

    if (task.status === "RESOLVED") {
      setFormError("Task đã được xử lý.");
      return;
    }

    setFormError(null);
    submittingRef.current = true;
    resolveMutation.mutate({
      taskId: task.id,
      decision,
      reviewComment: comment.trim() ? comment.trim() : undefined,
      needsStart: task.status === "PENDING",
    });
  };

  const isSubmitting = resolveMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Đóng chi tiết review"
        className="absolute inset-0 bg-[#17221c]/40"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-drawer-title"
        className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-[#e2e8e4] bg-white shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[#e2e8e4] bg-white px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              UC07 · Human Review
            </p>
            <h2 id="review-drawer-title" className="text-lg font-bold">
              Chi tiết review task
            </h2>
            <p className="mt-0.5 font-mono text-xs break-all text-gray-500">
              {taskId}
            </p>
          </div>

          <Button
            ref={closeButtonRef}
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Đóng"
            onClick={onClose}
          >
            <X />
          </Button>
        </header>

        <div className="space-y-5 px-5 py-5">
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

          {detailQuery.isLoading ? (
            <div
              className="flex items-center justify-center gap-3 py-12 text-sm text-gray-500"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="size-5 animate-spin text-[#173b2b]" />
              Đang tải review task…
            </div>
          ) : detailQuery.isError ? (
            <div
              className="flex flex-col items-center gap-3 py-12 text-center"
              role="alert"
            >
              <TriangleAlert className="size-6 text-red-600" />
              <p className="font-semibold">Không tải được review task</p>
              <p className="max-w-sm text-sm text-gray-500">
                {getApiErrorMessage(detailQuery.error)}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => detailQuery.refetch()}
              >
                Thử lại
              </Button>
            </div>
          ) : task ? (
            <>
              <section className="space-y-3 rounded-2xl border border-[#e2e8e4] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <ReviewStatusBadge status={task.status} />
                  <ReviewDecisionBadge decision={task.decision} />
                  <Badge tone="neutral">
                    <UserRound />
                    {task.assignee?.name ?? "Chưa phân công"}
                  </Badge>
                </div>

                <div>
                  <p className="text-base font-bold text-[#17221c]">
                    {getLeadName(task.lead)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Lead status:{" "}
                    <span className="font-semibold text-[#17221c]">
                      {task.lead?.status ?? "—"}
                    </span>
                  </p>
                </div>

                <dl className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="size-4 shrink-0" />
                    <span className="truncate">{task.lead?.email ?? "—"}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="size-4 shrink-0" />
                    <span>{task.lead?.phone ?? "—"}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="size-4 shrink-0" />
                    <span className="truncate">
                      {task.lead?.companyName ?? "—"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <UserRound className="size-4 shrink-0" />
                    <span className="truncate">{task.lead?.jobTitle ?? "—"}</span>
                  </div>
                </dl>

                <div className="border-t border-[#edf0ee] pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Lý do review
                  </p>
                  <p className="mt-1 text-sm leading-relaxed break-words text-[#17221c]">
                    {task.reason ?? "Không có lý do được ghi nhận."}
                  </p>
                </div>

                <div className="grid gap-2 border-t border-[#edf0ee] pt-3 text-xs text-gray-500 sm:grid-cols-3">
                  <span>Tạo: {formatDateTime(task.createdAt)}</span>
                  <span>Bắt đầu: {formatDateTime(task.startedAt)}</span>
                  <span>Xử lý: {formatDateTime(task.resolvedAt)}</span>
                </div>
              </section>

              <section className="space-y-3 rounded-2xl border border-[#e2e8e4] p-4">
                <div className="flex items-center gap-2">
                  <Bot className="size-4 text-[#173b2b]" />
                  <h3 className="text-sm font-bold">Kết quả AI</h3>
                </div>

                {qualificationQuery.isLoading ? (
                  <p className="text-sm text-gray-500">Đang tải dữ liệu AI…</p>
                ) : qualificationQuery.isError ? (
                  <p className="text-sm text-red-600">
                    {getApiErrorMessage(qualificationQuery.error)}
                  </p>
                ) : !qualification ? (
                  <p className="text-sm text-gray-500">
                    Lead chưa có bản định tính AI nào được lưu.
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="neutral">{qualification.status}</Badge>
                      {qualification.intent ? (
                        <Badge tone="info">{qualification.intent}</Badge>
                      ) : null}
                      {qualification.confidence !== null ? (
                        <Badge
                          tone={
                            qualification.confidence >= 0.8
                              ? "success"
                              : qualification.confidence >= 0.5
                                ? "warning"
                                : "danger"
                          }
                        >
                          Confidence{" "}
                          {(qualification.confidence * 100).toFixed(1)}%
                        </Badge>
                      ) : null}
                    </div>

                    {qualification.reason ? (
                      <p className="text-sm leading-relaxed text-[#17221c]">
                        {qualification.reason}
                      </p>
                    ) : null}

                    <p className="text-xs text-gray-500">
                      Model:{" "}
                      {qualification.modelProvider ?? "—"} /{" "}
                      {qualification.modelName ?? "—"} (
                      {qualification.modelVersion ?? "—"})
                    </p>

                    <details className="rounded-xl bg-[#f6f8f7] p-3">
                      <summary className="cursor-pointer text-xs font-semibold text-[#173b2b]">
                        Output snapshot
                      </summary>
                      <pre className="mt-2 max-h-56 overflow-auto text-xs whitespace-pre-wrap break-words text-gray-700">
                        {stringify(qualification.outputSnapshot)}
                      </pre>
                    </details>
                  </>
                )}

                {task.workflowRun ? (
                  <div className="rounded-xl border border-[#e2e8e4] p-3">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <Workflow className="size-4" />
                      {task.workflowRun.workflowName}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Trạng thái: {task.workflowRun.status}
                    </p>
                    {task.workflowRun.errorMessage ? (
                      <p className="mt-1 text-xs text-red-600">
                        {task.workflowRun.errorMessage}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </section>

              {task.status === "PENDING" ? (
                <section className="space-y-3 rounded-2xl border border-[#e2e8e4] p-4">
                  <h3 className="text-sm font-bold">Phân công reviewer</h3>
                  <ClaimReviewTaskButton
                    key={task.assignedTo ?? "unassigned"}
                    task={task}
                    reviewers={reviewers}
                    pending={claiming}
                    onClaim={onClaim}
                  />
                </section>
              ) : null}

              {task.status !== "RESOLVED" ? (
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 rounded-2xl border border-[#e2e8e4] p-4"
                >
                  <div>
                    <p className="text-sm font-bold">Quyết định review</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Gửi quyết định sẽ cập nhật trạng thái task và lead theo
                      backend.
                    </p>
                  </div>

                  <fieldset className="grid gap-2 sm:grid-cols-3">
                    <legend className="sr-only">Chọn quyết định</legend>
                    {DECISIONS.map((option) => {
                      const config = REVIEW_DECISION_CONFIG[option];
                      const Icon = config.icon;
                      const selected = decision === option;

                      return (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={selected}
                          disabled={isSubmitting}
                          onClick={() => {
                            setDecision(option);
                            setFormError(null);
                          }}
                          className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            selected
                              ? "border-[#173b2b] bg-[#173b2b] text-white"
                              : "border-[#e2e8e4] bg-white text-[#17221c] hover:bg-[#f0f4f1]"
                          }`}
                        >
                          <Icon className="size-4" />
                          {config.label}
                        </button>
                      );
                    })}
                  </fieldset>

                  <div className="space-y-2">
                    <Label htmlFor="review-comment">
                      Nhận xét của reviewer
                      {decision && decisionRequiresComment(decision) ? (
                        <span className="ml-1 text-red-600">*bắt buộc</span>
                      ) : (
                        <span className="ml-1 text-gray-400">(không bắt buộc)</span>
                      )}
                    </Label>
                    <Textarea
                      id="review-comment"
                      value={comment}
                      disabled={isSubmitting}
                      placeholder="Nhận xét về kết quả AI và quyết định của bạn…"
                      aria-invalid={
                        decision && decisionRequiresComment(decision)
                          ? !comment.trim()
                          : undefined
                      }
                      onChange={(event) => {
                        setComment(event.target.value);
                        setFormError(null);
                      }}
                    />
                  </div>

                  {decision ? (
                    <p className="text-xs text-gray-500">
                      Lead sẽ chuyển sang{" "}
                      <span className="font-semibold text-[#17221c]">
                        {LEAD_STATUS_BY_DECISION[decision]}
                      </span>{" "}
                      sau khi gửi.
                    </p>
                  ) : null}

                  {formError ? (
                    <p role="alert" className="text-sm font-medium text-red-600">
                      {formError}
                    </p>
                  ) : null}

                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={onClose}
                    >
                      Đóng
                    </Button>

                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Save />
                      )}
                      {isSubmitting ? "Đang gửi…" : "Gửi quyết định"}
                    </Button>
                  </div>
                </form>
              ) : (
                <section className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                    <CirclePlay className="size-4" />
                    Task đã xử lý
                  </p>
                  <p className="text-sm text-emerald-800">
                    Quyết định: {task.decision ?? "—"}
                  </p>
                  <p className="text-sm whitespace-pre-wrap text-emerald-800">
                    {task.reviewComment ?? "Không có nhận xết."}
                  </p>
                </section>
              )}
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
