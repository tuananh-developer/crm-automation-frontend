"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Clock,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  ShieldAlert,
  Star,
  TriangleAlert,
} from "lucide-react";

import {
  createFeedback,
  getCustomerFeedback,
} from "@/services/feedback.service";
import { getApiErrorMessage } from "@/services/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/components/segments/segment-utils";
import type { CustomerFeedbackItem } from "@/types/feedback";

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 20; // 60s max automatic polling budget
const STUCK_THRESHOLD_MS = 60_000; // 60s before a NEW item is considered stuck/timed-out

function isFeedbackStuck(
  item: CustomerFeedbackItem,
  pollingTimedOut: boolean,
): boolean {
  if (item.status !== "NEW") return false;
  if (pollingTimedOut) return true;
  const timestamp = new Date(item.createdAt || item.receivedAt).getTime();
  if (Number.isNaN(timestamp)) return false;
  return Date.now() - timestamp > STUCK_THRESHOLD_MS;
}

interface CustomerFeedbackTabProps {
  customerId: string;
}

export function CustomerFeedbackTab({ customerId }: CustomerFeedbackTabProps) {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [content, setContent] = React.useState("");
  const [source, setSource] = React.useState("WEB_PORTAL");
  const [rating, setRating] = React.useState<number | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isPollingTimedOut, setIsPollingTimedOut] = React.useState(false);
  const pollAttemptsRef = React.useRef(0);

  const {
    data: feedbackList = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["customer-feedback", customerId],
    queryFn: () => getCustomerFeedback(customerId),
    refetchInterval: (query) => {
      if (query.state.status === "error") {
        return false;
      }
      const data = query.state.data;
      const hasActiveNew =
        Array.isArray(data) &&
        data.some((item) => {
          if (item.status !== "NEW") return false;
          const createdMs = new Date(
            item.createdAt || item.receivedAt,
          ).getTime();
          return (
            Number.isNaN(createdMs) ||
            Date.now() - createdMs <= STUCK_THRESHOLD_MS
          );
        });

      if (!hasActiveNew) {
        pollAttemptsRef.current = 0;
        return false;
      }

      if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
        setIsPollingTimedOut(true);
        return false;
      }

      pollAttemptsRef.current += 1;
      return POLL_INTERVAL_MS;
    },
  });

  const handleManualRefresh = () => {
    pollAttemptsRef.current = 0;
    setIsPollingTimedOut(false);
    void refetch();
  };

  const submitMutation = useMutation({
    mutationFn: () =>
      createFeedback({
        customerId,
        source,
        content,
        ...(rating !== null ? { rating } : {}),
      }),
    onSuccess: () => {
      setContent("");
      setRating(null);
      setIsFormOpen(false);
      setSubmitError(null);
      pollAttemptsRef.current = 0;
      setIsPollingTimedOut(false);
      queryClient.invalidateQueries({
        queryKey: ["customer-feedback", customerId],
      });
      queryClient.invalidateQueries({
        queryKey: ["customer-360", customerId],
      });
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

  const hasStuckNewItems = feedbackList.some((item) =>
    isFeedbackStuck(item, isPollingTimedOut),
  );

  return (
    <div data-testid="customer-feedback-container" className="space-y-6">
      {/* Header with Submit Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#e2e8e4] bg-[#f9faf9] p-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="size-5 text-[#173b2b]" />
            <h3 className="text-base font-bold text-[#17221c]">
              Ý kiến phản hồi & Giám sát SLA (T12-WF14)
            </h3>
            <Badge tone="info" className="text-[11px]">
              AI Tự động phân loại
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            Hệ thống tự động khử thông tin nhạy cảm (PII), phân tích sắc thái
            cảm xúc, mức độ khẩn cấp và leo thang khiếu nại.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            data-testid="btn-open-feedback-form"
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="bg-[#173b2b] text-white hover:bg-[#123023]"
          >
            <Plus className="size-4" />
            {isFormOpen ? "Đóng form" : "Gửi phản hồi mới"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleManualRefresh}
            disabled={isFetching}
            title="Làm mới"
          >
            <RefreshCw
              className={`size-4 ${isFetching ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* New Feedback Form Modal / Drawer */}
      {isFormOpen && (
        <Card
          data-testid="feedback-form-card"
          className="border-emerald-200 bg-emerald-50/20"
        >
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <h4 className="text-sm font-bold text-[#17221c]">
                Nhập phản hồi từ khách hàng
              </h4>

              {submitError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
                >
                  {submitError}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="fb-source"
                    className="text-xs font-semibold text-gray-600"
                  >
                    Kênh tiếp nhận
                  </Label>
                  <Input
                    id="fb-source"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="VD: EMAIL, CALL, WEB_PORTAL"
                    className="h-8 bg-white text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="fb-rating"
                    className="text-xs font-semibold text-gray-600"
                  >
                    Đánh giá mức độ hài lòng (1 - 5 sao, không bắt buộc)
                  </Label>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        data-testid={`btn-feedback-rating-${star}`}
                        onClick={() =>
                          setRating((prev) => (prev === star ? null : star))
                        }
                        className={`transition-colors ${
                          rating !== null && rating >= star
                            ? "text-amber-400"
                            : "text-gray-300"
                        }`}
                        aria-label={`Chọn ${star} sao`}
                      >
                        <Star className="size-5 fill-current" />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-gray-700">
                      {rating !== null
                        ? `${rating}/5 sao`
                        : "Chưa chọn đánh giá"}
                    </span>
                    {rating !== null && (
                      <button
                        type="button"
                        onClick={() => setRating(null)}
                        className="text-[11px] font-medium text-gray-500 underline hover:text-gray-700"
                      >
                        Bỏ chọn
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="fb-content"
                  className="text-xs font-semibold text-gray-600"
                >
                  Nội dung phản hồi (Tự động khử PII trước khi gửi AI)
                </Label>
                <Textarea
                  id="fb-content"
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Ghi chép nhận xét, phản ánh hoặc yêu cầu hỗ trợ của khách hàng..."
                  className="bg-white text-xs"
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
                  data-testid="btn-submit-feedback"
                  disabled={submitMutation.isPending || !content.trim()}
                  className="bg-[#173b2b] text-white hover:bg-[#123023]"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Send className="size-3.5" />
                      Gửi & Phân loại AI
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stuck / Timed-out Polling Notice */}
      {hasStuckNewItems && (
        <div
          role="status"
          data-testid="feedback-polling-timeout-banner"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"
        >
          <div className="flex items-center gap-2">
            <TriangleAlert className="size-4 shrink-0 text-amber-600" />
            <span>
              Một số phản hồi đang chờ AI phân loại lâu hơn dự kiến. Đã tạm dừng
              tự động làm mới để tránh quá tải.
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleManualRefresh}
            disabled={isFetching}
          >
            <RefreshCw
              className={`size-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
            Kiểm tra lại ngay
          </Button>
        </div>
      )}

      {/* Background Refresh Error Banner when cached items exist */}
      {isError && feedbackList.length > 0 && (
        <div
          role="alert"
          data-testid="feedback-refresh-error-banner"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800"
        >
          <div className="flex items-center gap-2">
            <TriangleAlert className="size-4 shrink-0 text-red-600" />
            <span>
              Không thể làm mới danh sách phản hồi: {getApiErrorMessage(error)}
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleManualRefresh}
          >
            <RefreshCw className="size-3.5" />
            Thử lại
          </Button>
        </div>
      )}

      {/* Feedback List */}
      {isLoading ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 text-gray-500">
          <Loader2 className="size-6 animate-spin text-[#173b2b]" />
          <p className="text-xs">Đang tải danh sách phản hồi...</p>
        </div>
      ) : isError ? (
        <Card
          role="alert"
          data-testid="feedback-query-error-card"
          className="border-red-200 bg-red-50/60 p-6 text-center"
        >
          <TriangleAlert className="mx-auto size-7 text-red-600" />
          <p className="mt-2 text-xs font-bold text-red-900">
            Không thể tải danh sách phản hồi của khách hàng
          </p>
          <p className="mt-1 text-xs text-red-700">
            {getApiErrorMessage(error)}
          </p>
          <div className="mt-3 flex justify-center">
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
      ) : feedbackList.length === 0 ? (
        <Card className="border-dashed border-gray-300 bg-gray-50/50 p-6 text-center">
          <MessageSquare className="mx-auto size-7 text-gray-400" />
          <p className="mt-2 text-xs font-medium text-gray-600">
            Chưa có phản hồi nào được ghi nhận cho khách hàng này.
          </p>
        </Card>
      ) : (
        <div data-testid="feedback-list" className="space-y-3">
          {feedbackList.map((item) => (
            <FeedbackItemCard
              key={item.id}
              item={item}
              isStuck={isFeedbackStuck(item, isPollingTimedOut)}
              onRetry={handleManualRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FeedbackItemCard({
  item,
  isStuck,
  onRetry,
}: {
  item: CustomerFeedbackItem;
  isStuck: boolean;
  onRetry: () => void;
}) {
  const isEscalated =
    item.status === "ESCALATED" || item.urgency === "CRITICAL";

  return (
    <Card
      data-testid={`feedback-item-${item.id}`}
      className={`overflow-hidden transition-all ${
        isEscalated ? "border-red-300 bg-red-50/20" : "border-[#e2e8e4]"
      }`}
    >
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Sentiment Badge */}
            {item.sentiment && (
              <Badge
                tone={
                  item.sentiment === "POSITIVE"
                    ? "success"
                    : item.sentiment === "NEGATIVE"
                      ? "danger"
                      : "neutral"
                }
              >
                {item.sentiment}
              </Badge>
            )}

            {/* Category */}
            {item.category && <Badge tone="info">{item.category}</Badge>}

            {/* Urgency */}
            {item.urgency && (
              <Badge
                tone={
                  item.urgency === "CRITICAL" || item.urgency === "HIGH"
                    ? "danger"
                    : item.urgency === "MEDIUM"
                      ? "warning"
                      : "neutral"
                }
              >
                Khẩn cấp: {item.urgency}
              </Badge>
            )}

            {/* Escalation Pill */}
            {isEscalated && (
              <Badge tone="danger" className="animate-pulse gap-1 font-bold">
                <ShieldAlert className="size-3" />
                ĐÃ LEO THANG (ESCALATED)
              </Badge>
            )}

            {/* Processing / Status Badges */}
            {item.status === "NEW" && !isStuck && (
              <Badge tone="warning" className="animate-pulse gap-1 font-medium">
                <Loader2 className="size-3 animate-spin" />
                Đang phân loại AI...
              </Badge>
            )}

            {item.status === "NEW" && isStuck && (
              <Badge
                tone="warning"
                data-testid={`feedback-stuck-badge-${item.id}`}
                className="gap-1 font-medium"
              >
                <AlertCircle className="size-3" />
                Quá thời gian chờ AI (Stuck)
              </Badge>
            )}

            {item.status === "FAILED" && (
              <Badge tone="danger" className="gap-1 font-medium">
                <AlertCircle className="size-3" />
                Phân loại thất bại
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            {item.rating !== null && item.rating !== undefined && (
              <>
                <span className="flex items-center gap-0.5 font-bold text-amber-500">
                  <Star className="size-3.5 fill-current" />
                  {item.rating}/5
                </span>
                <span>•</span>
              </>
            )}
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {formatDateTime(item.receivedAt || item.createdAt)}
            </span>
          </div>
        </div>

        <p className="whitespace-pre-wrap text-xs leading-relaxed text-[#17221c]">
          {item.content}
        </p>

        {item.errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
            <strong>Lỗi:</strong> {item.errorMessage}
          </div>
        )}

        {item.status === "NEW" && isStuck && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50/70 p-2 text-xs text-amber-900">
            <span>
              Tiến trình phân loại AI chưa phản hồi. Bạn có thể bấm kiểm tra lại
              trạng thái.
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="h-6 px-2 text-[11px]"
            >
              <RefreshCw className="size-3" />
              Kiểm tra lại
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-[#edf0ee] pt-2 text-[11px] text-gray-500">
          <span>
            Kênh: <strong className="text-gray-700">{item.source}</strong>
          </span>
          <span>
            Trạng thái: <strong className="text-gray-700">{item.status}</strong>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
