"use client";

import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Check,
  CheckSquare,
  Clock,
  FileText,
  ListTodo,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Square,
  TriangleAlert,
  X,
} from "lucide-react";

import {
  createTranscript,
  getTranscriptSummary,
  updateActionItem,
} from "@/services/conversation.service";
import { getApiErrorMessage } from "@/services/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/components/segments/segment-utils";
import {
  checkTranscriptStuck,
  evaluatePollStep,
  isTranscriptProcessingActive,
  isTranscriptProcessingDone,
  isTranscriptProcessingFailed,
} from "@/lib/workflow-polling";
import type {
  ActionItem,
  ActionItemApprovalState,
  ConversationTranscriptItem,
} from "@/types/conversation";

interface CustomerConversationsTabProps {
  customerId: string;
  initialTranscriptId?: string | null;
  initialPollingTimedOut?: boolean;
}

export function CustomerConversationsTab({
  customerId,
  initialTranscriptId = null,
  initialPollingTimedOut = false,
}: CustomerConversationsTabProps) {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [sourceType, setSourceType] = React.useState("CALL");
  const [content, setContent] = React.useState("");
  const [lastTranscriptId, setLastTranscriptId] = React.useState<string | null>(
    initialTranscriptId,
  );
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isPollingTimedOut, setIsPollingTimedOut] = React.useState(
    initialPollingTimedOut,
  );
  const pollAttemptsRef = React.useRef(0);

  // Poll latest transcript summary if created
  const {
    data: transcriptData,
    isLoading: isFetchingSummary,
    isError: isSummaryError,
    error: summaryError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["conversation-summary", lastTranscriptId],
    queryFn: () =>
      lastTranscriptId ? getTranscriptSummary(lastTranscriptId) : null,
    enabled: Boolean(lastTranscriptId),
    refetchInterval: (query) => {
      const status = query.state.data?.processingStatus;
      return evaluatePollStep({
        isQueryError: query.state.status === "error",
        isActive: isTranscriptProcessingActive(status),
        attemptsRef: pollAttemptsRef,
        onTimeout: () => {
          setTimeout(() => setIsPollingTimedOut(true), 0);
        },
      });
    },
  });

  const handleManualRefresh = () => {
    pollAttemptsRef.current = 0;
    setIsPollingTimedOut(false);
    void refetch();
  };

  const submitMutation = useMutation({
    mutationFn: () =>
      createTranscript({
        customerId,
        sourceType,
        content,
      }),
    onSuccess: (data) => {
      setContent("");
      setIsFormOpen(false);
      setSubmitError(null);
      pollAttemptsRef.current = 0;
      setIsPollingTimedOut(false);
      setLastTranscriptId(data.transcriptId);
    },
    onError: (err) => {
      setSubmitError(getApiErrorMessage(err));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitError(null);
    submitMutation.mutate();
  };

  const isTranscriptStuck = checkTranscriptStuck(
    transcriptData,
    isPollingTimedOut,
    lastTranscriptId,
  );

  return (
    <div data-testid="customer-conversations-container" className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#e2e8e4] bg-[#f9faf9] p-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-[#173b2b]" />
            <h3 className="text-base font-bold text-[#17221c]">
              Hội thoại & Biên bản Tóm lược AI (T12-WF09)
            </h3>
            <Badge tone="info" className="text-[11px]">
              Tự động trích xuất Action Items
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            Nạp nội dung cuộc gọi hoặc họp bán hàng để AI tạo bản tóm tắt điều
            hành và danh sách nhiệm vụ cần làm.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            data-testid="btn-open-transcript-form"
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="bg-[#173b2b] text-white hover:bg-[#123023]"
          >
            <Plus className="size-4" />
            {isFormOpen ? "Đóng form" : "Ghi nhận hội thoại mới"}
          </Button>

          {lastTranscriptId && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleManualRefresh}
              disabled={isFetching || isFetchingSummary}
              title="Làm mới"
            >
              <RefreshCw
                className={`size-4 ${
                  isFetching || isFetchingSummary ? "animate-spin" : ""
                }`}
              />
            </Button>
          )}
        </div>
      </div>

      {/* Stuck / Timed-out Summary Polling Notice */}
      {isTranscriptStuck && (
        <div
          role="status"
          data-testid="transcript-polling-timeout-banner"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"
        >
          <div className="flex items-center gap-2">
            <TriangleAlert className="size-4 shrink-0 text-amber-600" />
            <span>
              Tiến trình AI tóm lược hội thoại đang xử lý lâu hơn dự kiến. Đã tạm
              dừng tự động làm mới để tránh quá tải.
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleManualRefresh}
            disabled={isFetching || isFetchingSummary}
          >
            <RefreshCw
              className={`size-3.5 ${
                isFetching || isFetchingSummary ? "animate-spin" : ""
              }`}
            />
            Kiểm tra lại ngay
          </Button>
        </div>
      )}

      {/* PII Redaction Compliance Note */}
      <div className="flex items-center gap-2.5 rounded-lg border border-emerald-100 bg-emerald-50/60 p-3 text-xs text-emerald-900">
        <ShieldCheck className="size-4 shrink-0 text-emerald-600" />
        <span>
          <strong>Chính sách Bảo mật & Quyền riêng tư (Topic 12):</strong> Toàn
          bộ email, số điện thoại, chuỗi thẻ 16 chữ số, mã IBAN và số tài khoản
          có nhãn (STK / Account No.) sẽ tự động được khử định danh (PII
          Redaction) trên máy chủ NestJS trước khi chuyển tiếp cho mô hình AI
          Gemini.
        </span>
      </div>

      {/* Ingest Form */}
      {isFormOpen && (
        <Card
          data-testid="transcript-form-card"
          className="border-emerald-200 bg-emerald-50/20"
        >
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <h4 className="text-sm font-bold text-[#17221c]">
                Nhập nội dung biên bản trao đổi / cuộc gọi
              </h4>

              {submitError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
                >
                  {submitError}
                </div>
              )}

              <div className="space-y-1.5">
                <Label
                  htmlFor="source-type"
                  className="text-xs font-semibold text-gray-600"
                >
                  Kênh tương tác
                </Label>
                <select
                  id="source-type"
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                  className="h-8 w-full rounded-lg border border-gray-300 bg-white px-2.5 text-xs font-medium text-gray-800 focus:border-[#173b2b] focus:outline-none"
                >
                  <option value="CALL">Cuộc gọi điện thoại (Phone Call)</option>
                  <option value="MEETING">
                    Cuộc họp trực tiếp / Google Meet (Sales Meeting)
                  </option>
                  <option value="EMAIL">Trao đổi qua Email</option>
                  <option value="CHAT">
                    Tin nhắn trò chuyện (Chat / Zalo / Slack)
                  </option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="transcript-content"
                  className="text-xs font-semibold text-gray-600"
                >
                  Văn bản hội thoại
                </Label>
                <Textarea
                  id="transcript-content"
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Dán nội dung trao đổi hoặc biên bản cuộc họp vào đây (VD: Khách hàng trao đổi về việc nâng gói Enterprise 50 user vào tháng tới...)"
                  className="bg-white font-mono text-xs"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFormOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  data-testid="btn-submit-transcript"
                  disabled={submitMutation.isPending || !content.trim()}
                  className="bg-[#173b2b] text-white hover:bg-[#123023]"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Đang xử lý & Redact...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-3.5" />
                      Gửi tóm tắt AI (T12-WF09)
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Latest Transcript Summary Result */}
      {transcriptData ? (
        <TranscriptDetailCard
          data={transcriptData}
          isStuck={isTranscriptStuck}
          onActionItemUpdated={() => refetch()}
          onReopenForm={() => setIsFormOpen(true)}
          onManualRetry={handleManualRefresh}
        />
      ) : lastTranscriptId && isFetchingSummary ? (
        <Card className="p-8 text-center text-gray-500">
          <Loader2 className="mx-auto size-7 animate-spin text-[#173b2b]" />
          <p className="mt-2 text-xs font-medium">
            AI đang tóm lược cuộc hội thoại và trích xuất Action Items...
          </p>
        </Card>
      ) : lastTranscriptId && isSummaryError ? (
        <Card
          role="alert"
          data-testid="transcript-summary-error-card"
          className="border-red-200 bg-red-50/60 p-6 text-center"
        >
          <TriangleAlert className="mx-auto size-7 text-red-600" />
          <p className="mt-2 text-xs font-bold text-red-900">
            Không thể tải kết quả tóm lược hội thoại
          </p>
          <p className="mt-1 text-xs text-red-700">
            {getApiErrorMessage(summaryError)}
          </p>
          <div className="mt-3 flex justify-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleManualRefresh}
            >
              <RefreshCw className="size-3.5" />
              Thử tải lại
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="border-dashed border-gray-300 bg-gray-50/50 p-6 text-center">
          <MessageSquare className="mx-auto size-7 text-gray-400" />
          <p className="mt-2 text-xs font-medium text-gray-600">
            Chưa có biên bản hội thoại nào được nạp gần đây.
          </p>
          <p className="text-[11px] text-gray-400">
            Bấm nút &quot;Ghi nhận hội thoại mới&quot; để AI phân tích và tự
            động tạo việc cần làm (Action Items).
          </p>
        </Card>
      )}
    </div>
  );
}

export function TranscriptDetailCard({
  data,
  isStuck,
  onActionItemUpdated,
  onReopenForm,
  onManualRetry,
}: {
  data: ConversationTranscriptItem;
  isStuck?: boolean;
  onActionItemUpdated: () => void;
  onReopenForm: () => void;
  onManualRetry?: () => void;
}) {
  const isDone = isTranscriptProcessingDone(data.processingStatus);
  const isFailed = isTranscriptProcessingFailed(data.processingStatus);
  const isPending = isTranscriptProcessingActive(data.processingStatus);
  const summary = data.summary;

  return (
    <Card
      data-testid="transcript-result-card"
      className="border-[#173b2b]/20 shadow-sm"
    >
      <div className="border-b border-[#e2e8e4] bg-[#f4f7f5] px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[#173b2b]" />
            <span className="text-sm font-bold text-[#17221c]">
              Kết quả Tóm lược Hội thoại ({data.sourceType})
            </span>
            {isDone ? (
              <Badge
                tone={data.processingStatus === "PARTIAL" ? "warning" : "success"}
                data-testid="transcript-done-badge"
              >
                {data.processingStatus}
              </Badge>
            ) : isPending && !isStuck ? (
              <Badge
                tone="info"
                data-testid="transcript-processing-badge"
                className="animate-pulse gap-1 font-medium"
              >
                <Loader2 className="size-3 animate-spin" />
                {data.processingStatus}
              </Badge>
            ) : isPending && isStuck ? (
              <Badge
                tone="warning"
                data-testid="transcript-stuck-badge"
                className="gap-1 font-medium"
              >
                <AlertCircle className="size-3" />
                Quá thời gian chờ AI (Stuck)
              </Badge>
            ) : (
              <Badge tone="danger" data-testid="transcript-failed-badge">
                {data.processingStatus}
              </Badge>
            )}
          </div>

          {summary?.sentiment && (
            <Badge
              tone={
                summary.sentiment === "POSITIVE"
                  ? "success"
                  : summary.sentiment === "NEGATIVE"
                    ? "danger"
                    : "neutral"
              }
            >
              Cảm xúc: {summary.sentiment}
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="space-y-5 p-5">
        {summary ? (
          <>
            {/* Executive Summary */}
            <div className="rounded-lg border border-[#edf0ee] bg-[#fafbfa] p-4">
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
                Tóm lược điều hành
              </p>
              <p className="text-xs leading-relaxed text-[#17221c]">
                {summary.summaryText}
              </p>
              {summary.intent && (
                <p className="mt-2 text-[11px] text-gray-500">
                  <strong>Ý định chính:</strong> {summary.intent}
                </p>
              )}
            </div>

            {/* Key Points */}
            {summary.keyPoints && summary.keyPoints.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                  Điểm nhấn trọng tâm (Key Takeaways)
                </p>
                <ul className="space-y-1 text-xs text-gray-700">
                  {summary.keyPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-bold text-[#173b2b]">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Items Checklist */}
            {summary.actionItems && summary.actionItems.length > 0 && (
              <div className="border-t border-[#edf0ee] pt-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ListTodo className="size-4 text-[#173b2b]" />
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-700">
                      Nhiệm vụ trích xuất (Action Items -{" "}
                      {summary.actionItems.length})
                    </p>
                  </div>
                  <span className="text-[11px] text-gray-500">
                    Cần phê duyệt (Approve) đề xuất của AI trước khi đánh dấu
                    hoàn thành
                  </span>
                </div>

                <div className="space-y-2">
                  {summary.actionItems.map((item) => (
                    <ActionItemRow
                      key={item.id}
                      item={item}
                      onUpdated={onActionItemUpdated}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : isFailed ? (
          <div
            role="alert"
            data-testid="transcript-processing-failed"
            className="rounded-lg border border-red-200 bg-red-50/70 p-4 text-xs text-red-900"
          >
            <div className="flex items-start gap-2.5">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-red-600" />
              <div className="space-y-2">
                <p className="font-bold">
                  Quá trình AI phân tích hội thoại thất bại (FAILED)
                </p>
                <p className="text-red-700">
                  {data.errorMessage ||
                    "Tiến trình tóm lược AI gặp sự cố hoặc quá thời gian chờ. Vui lòng thử kiểm tra lại trạng thái hoặc gửi lại biên bản hội thoại."}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={onActionItemUpdated}
                  >
                    <RefreshCw className="size-3.5" />
                    Thử kiểm tra lại
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={onReopenForm}
                  >
                    Ghi nhận lại hội thoại
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : isPending && isStuck ? (
          <div
            data-testid="transcript-stuck-panel"
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900"
          >
            <span>
              Tiến trình tóm lược AI chưa phản hồi sau thời gian chờ. Bạn có thể
              bấm kiểm tra lại trạng thái hoặc ghi nhận lại hội thoại.
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onManualRetry}
                className="h-7 px-2.5 text-xs"
              >
                <RefreshCw className="size-3" />
                Kiểm tra lại
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onReopenForm}
                className="h-7 px-2.5 text-xs"
              >
                Ghi nhận lại
              </Button>
            </div>
          </div>
        ) : isPending ? (
          <p
            data-testid="transcript-processing-message"
            className="flex items-center gap-2 text-xs italic text-gray-500"
          >
            <Loader2 className="size-3.5 animate-spin text-[#173b2b]" />
            Đang chờ AI phản hồi...
          </p>
        ) : (
          <p className="text-xs italic text-gray-500">
            Chưa có nội dung tóm lược cho biên bản này.
          </p>
        )}

        {/* Redacted Preview */}
        <div className="border-t border-[#edf0ee] pt-3 text-[11px] text-gray-400">
          <span className="font-semibold text-gray-500">
            Văn bản đã qua khử PII:{" "}
          </span>
          <span className="font-mono italic">
            {data.redactedContent.slice(0, 150)}...
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

const APPROVAL_STATE_LABELS: Record<ActionItemApprovalState, string> = {
  PROPOSED: "Đề xuất AI (PROPOSED)",
  APPROVED: "Đã duyệt (APPROVED)",
  REJECTED: "Đã từ chối (REJECTED)",
};

function ActionItemRow({
  item,
  onUpdated,
}: {
  item: ActionItem;
  onUpdated: () => void;
}) {
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [updateError, setUpdateError] = React.useState<string | null>(null);

  const approvalState: ActionItemApprovalState =
    item.approvalState ?? "PROPOSED";
  const isApproved = approvalState === "APPROVED";
  const isRejected = approvalState === "REJECTED";
  const isProposed = approvalState === "PROPOSED";
  const isDone = item.status === "COMPLETED";

  const handleApprovalDecision = async (
    nextApprovalState: "APPROVED" | "REJECTED",
  ) => {
    setIsUpdating(true);
    setUpdateError(null);
    try {
      await updateActionItem(item.id, {
        approvalState: nextApprovalState,
        ...(nextApprovalState === "REJECTED" ? { status: "CANCELLED" } : {}),
      });
      onUpdated();
    } catch (err) {
      setUpdateError(getApiErrorMessage(err));
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleStatus = async () => {
    if (!isApproved) {
      setUpdateError(
        isRejected
          ? "Không thể hoàn thành nhiệm vụ đã bị từ chối (REJECTED)."
          : "Nhiệm vụ đề xuất bởi AI (PROPOSED) cần được phê duyệt (Approve) trước khi đánh dấu hoàn thành.",
      );
      return;
    }

    setIsUpdating(true);
    setUpdateError(null);
    try {
      await updateActionItem(item.id, {
        status: isDone ? "PENDING" : "COMPLETED",
      });
      onUpdated();
    } catch (err) {
      setUpdateError(getApiErrorMessage(err));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      data-testid={`action-item-${item.id}`}
      className="space-y-2 rounded-lg border border-[#e2e8e4] bg-white p-3 text-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            data-testid={`btn-toggle-action-item-${item.id}`}
            onClick={toggleStatus}
            disabled={isUpdating || !isApproved}
            title={
              isApproved
                ? "Đánh dấu hoàn thành / chưa hoàn thành"
                : "Cần phê duyệt (Approve) nhiệm vụ trước khi hoàn thành"
            }
            className="text-[#173b2b] hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isDone ? (
              <CheckSquare className="size-4 text-emerald-600" />
            ) : (
              <Square className="size-4 text-gray-400" />
            )}
          </button>
          <span
            className={`font-medium ${
              isDone || isRejected
                ? "text-gray-400 line-through"
                : "text-[#17221c]"
            }`}
          >
            {item.title}
          </span>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Badge
            tone={
              isApproved ? "success" : isRejected ? "danger" : "warning"
            }
            className="text-[10px]"
          >
            {APPROVAL_STATE_LABELS[approvalState] ?? approvalState}
          </Badge>

          <Badge tone={isDone ? "success" : "neutral"} className="text-[10px]">
            {item.status}
          </Badge>

          {isProposed && (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                data-testid={`btn-approve-action-item-${item.id}`}
                disabled={isUpdating}
                onClick={() => handleApprovalDecision("APPROVED")}
                className="h-6 border-emerald-300 bg-emerald-50 px-2 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                <Check className="size-3" />
                Phê duyệt
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                data-testid={`btn-reject-action-item-${item.id}`}
                disabled={isUpdating}
                onClick={() => handleApprovalDecision("REJECTED")}
                className="h-6 border-red-200 bg-red-50 px-2 text-[11px] font-semibold text-red-700 hover:bg-red-100"
              >
                <X className="size-3" />
                Từ chối
              </Button>
            </div>
          )}

          {item.dueAt && (
            <span className="flex items-center gap-1 text-[10px] text-gray-400">
              <Clock className="size-3" />
              Hạn: {formatDateTime(item.dueAt)}
            </span>
          )}
        </div>
      </div>

      {updateError && (
        <div
          role="alert"
          data-testid={`action-item-error-${item.id}`}
          className="flex items-center justify-between gap-2 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] text-red-700"
        >
          <span>{updateError}</span>
          <button
            type="button"
            onClick={() => setUpdateError(null)}
            className="font-semibold underline hover:no-underline"
          >
            Đóng
          </button>
        </div>
      )}
    </div>
  );
}
