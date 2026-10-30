"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  FileText,
  Lightbulb,
  ListTodo,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
  User,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/components/segments/segment-utils";
import type { ActionItem, ConversationTranscriptItem } from "@/types/conversation";

interface CustomerConversationsTabProps {
  customerId: string;
}

export function CustomerConversationsTab({
  customerId,
}: CustomerConversationsTabProps) {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [sourceType, setSourceType] = React.useState("CALL");
  const [content, setContent] = React.useState("");
  const [lastTranscriptId, setLastTranscriptId] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Poll latest transcript summary if created
  const {
    data: transcriptData,
    isLoading: isFetchingSummary,
    refetch,
  } = useQuery({
    queryKey: ["conversation-summary", lastTranscriptId],
    queryFn: () => (lastTranscriptId ? getTranscriptSummary(lastTranscriptId) : null),
    enabled: Boolean(lastTranscriptId),
    refetchInterval: (query) => {
      const status = query.state.data?.processingStatus;
      return status === "PENDING" || status === "PROCESSING" ? 3000 : false;
    },
  });

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
            Nạp nội dung cuộc gọi hoặc họp bán hàng để AI tạo bản tóm tắt điều hành và danh sách nhiệm vụ cần làm.
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
        </div>
      </div>

      {/* PII Redaction Compliance Note */}
      <div className="flex items-center gap-2.5 rounded-lg border border-emerald-100 bg-emerald-50/60 p-3 text-xs text-emerald-900">
        <ShieldCheck className="size-4 shrink-0 text-emerald-600" />
        <span>
          <strong>Chính sách Bảo mật & Quyền riêng tư (Topic 12):</strong> Toàn bộ email, số điện thoại và số tài khoản sẽ tự động được khử định danh (PII Redaction) trên máy chủ NestJS trước khi chuyển tiếp cho mô hình AI Gemini.
        </span>
      </div>

      {/* Ingest Form */}
      {isFormOpen && (
        <Card data-testid="transcript-form-card" className="border-emerald-200 bg-emerald-50/20">
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <h4 className="text-sm font-bold text-[#17221c]">
                Nhập nội dung biên bản trao đổi / cuộc gọi
              </h4>

              {submitError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {submitError}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="source-type" className="text-xs font-semibold text-gray-600">
                  Kênh tương tác
                </Label>
                <select
                  id="source-type"
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                  className="h-8 w-full rounded-lg border border-gray-300 bg-white px-2.5 text-xs font-medium text-gray-800 focus:border-[#173b2b] focus:outline-none"
                >
                  <option value="CALL">Cuộc gọi điện thoại (Phone Call)</option>
                  <option value="MEETING">Cuộc họp trực tiếp / Google Meet (Sales Meeting)</option>
                  <option value="EMAIL">Trao đổi qua Email</option>
                  <option value="CHAT">Tin nhắn trò chuyện (Chat / Zalo / Slack)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="transcript-content" className="text-xs font-semibold text-gray-600">
                  Văn bản hội thoại
                </Label>
                <Textarea
                  id="transcript-content"
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Dán nội dung trao đổi hoặc biên bản cuộc họp vào đây (VD: Khách hàng trao đổi về việc nâng gói Enterprise 50 user vào tháng tới...)"
                  className="text-xs bg-white font-mono"
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
        <TranscriptDetailCard data={transcriptData} onActionItemUpdated={() => refetch()} />
      ) : lastTranscriptId && isFetchingSummary ? (
        <Card className="p-8 text-center text-gray-500">
          <Loader2 className="mx-auto size-7 animate-spin text-[#173b2b]" />
          <p className="mt-2 text-xs font-medium">AI đang tóm lược cuộc hội thoại và trích xuất Action Items...</p>
        </Card>
      ) : (
        <Card className="border-dashed border-gray-300 bg-gray-50/50 p-6 text-center">
          <MessageSquare className="mx-auto size-7 text-gray-400" />
          <p className="mt-2 text-xs font-medium text-gray-600">
            Chưa có biên bản hội thoại nào được nạp gần đây.
          </p>
          <p className="text-[11px] text-gray-400">
            Bấm nút &quot;Ghi nhận hội thoại mới&quot; để AI phân tích và tự động tạo việc cần làm (Action Items).
          </p>
        </Card>
      )}
    </div>
  );
}

function TranscriptDetailCard({
  data,
  onActionItemUpdated,
}: {
  data: ConversationTranscriptItem;
  onActionItemUpdated: () => void;
}) {
  const isDone = data.processingStatus === "COMPLETED";
  const isPending = data.processingStatus === "PENDING" || data.processingStatus === "PROCESSING";
  const summary = data.summary;

  return (
    <Card data-testid="transcript-result-card" className="border-[#173b2b]/20 shadow-sm">
      <div className="bg-[#f4f7f5] px-5 py-3 border-b border-[#e2e8e4]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[#173b2b]" />
            <span className="font-bold text-sm text-[#17221c]">
              Kết quả Tóm lược Hội thoại ({data.sourceType})
            </span>
            <Badge tone={isDone ? "success" : isPending ? "info" : "danger"}>
              {data.processingStatus}
            </Badge>
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
            <div className="rounded-lg bg-[#fafbfa] p-4 border border-[#edf0ee]">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
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
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Điểm nhấn trọng tâm (Key Takeaways)
                </p>
                <ul className="space-y-1 text-xs text-gray-700">
                  {summary.keyPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#173b2b] font-bold">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Items Checklist */}
            {summary.actionItems && summary.actionItems.length > 0 && (
              <div className="border-t border-[#edf0ee] pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <ListTodo className="size-4 text-[#173b2b]" />
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Nhiệm vụ trích xuất (Action Items - {summary.actionItems.length})
                  </p>
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
        ) : (
          <p className="text-xs italic text-gray-500">Đang chờ AI phản hồi...</p>
        )}

        {/* Redacted Preview */}
        <div className="border-t border-[#edf0ee] pt-3 text-[11px] text-gray-400">
          <span className="font-semibold text-gray-500">Văn bản đã qua khử PII: </span>
          <span className="italic font-mono">{data.redactedContent.slice(0, 150)}...</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionItemRow({
  item,
  onUpdated,
}: {
  item: ActionItem;
  onUpdated: () => void;
}) {
  const [isUpdating, setIsUpdating] = React.useState(false);
  const isDone = item.status === "COMPLETED";

  const toggleStatus = async () => {
    setIsUpdating(true);
    try {
      await updateActionItem(item.id, {
        status: isDone ? "PENDING" : "COMPLETED",
      });
      onUpdated();
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      data-testid={`action-item-${item.id}`}
      className="flex items-center justify-between gap-3 rounded-lg border border-[#e2e8e4] p-3 text-xs bg-white"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={toggleStatus}
          disabled={isUpdating}
          className="text-[#173b2b] hover:opacity-80 disabled:opacity-50"
        >
          {isDone ? (
            <CheckSquare className="size-4 text-emerald-600" />
          ) : (
            <Square className="size-4 text-gray-400" />
          )}
        </button>
        <span className={`font-medium ${isDone ? "line-through text-gray-400" : "text-[#17221c]"}`}>
          {item.title}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Badge tone={isDone ? "success" : "neutral"} className="text-[10px]">
          {item.status}
        </Badge>
        {item.dueAt && (
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Clock className="size-3" />
            Hạn: {formatDateTime(item.dueAt)}
          </span>
        )}
      </div>
    </div>
  );
}

