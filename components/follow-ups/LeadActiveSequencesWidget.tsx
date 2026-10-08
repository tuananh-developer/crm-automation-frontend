"use client";

import * as React from "react";
import Link from "next/link";
import {
  Clock,
  PlayCircle,
  PauseCircle,
  Plus,
  ArrowRight,
  ExternalLink,
  Ban,
  History,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { EnrollmentStatusBadge } from "./EnrollmentStatusBadge";
import { ChannelBadge } from "./ChannelBadge";
import { CancelEnrollmentDialog } from "./CancelEnrollmentDialog";
import { LeadEnrollmentModal } from "./LeadEnrollmentModal";
import { formatDelayDescription } from "@/lib/delay-utils";
import {
  useLeadEnrollments,
  useUpdateEnrollmentStatus,
} from "@/hooks/use-enrollment";
import type { LeadFollowUpEnrollment } from "@/types/follow-up";
import type { Lead } from "@/types/lead";

export interface LeadActiveSequencesWidgetProps {
  lead: Lead;
}

/**
 * Widget hiển thị và quản lý các Sequence đang gán cho Lead trên Lead Detail Page (FE-07 UC05).
 * - Hiển thị tên sequence đang chạy, badge trạng thái (ACTIVE, PAUSED, COMPLETED, CANCELLED).
 * - Current Step Indicator: Bước x/y kèm progress bar mini.
 * - Nút thao tác nhanh: Pause / Resume, Cancel (với popup xác nhận).
 * - Empty state: "Chưa có chuỗi chăm sóc nào được kích hoạt. [Enroll ngay]".
 * - Lịch sử các lần ghi danh trước đó.
 */
export function LeadActiveSequencesWidget({ lead }: LeadActiveSequencesWidgetProps) {
  const [isEnrollModalOpen, setIsEnrollModalOpen] = React.useState(false);
  const [enrollmentToCancel, setEnrollmentToCancel] =
    React.useState<LeadFollowUpEnrollment | null>(null);
  const [showHistory, setShowHistory] = React.useState(false);
  const [statusFeedback, setStatusFeedback] = React.useState<string | null>(null);

  // 1. Fetch enrollments for this lead via custom hook
  const {
    data: enrollments = [],
    isLoading,
    refetch,
  } = useLeadEnrollments(lead?.id);

  // 2. Mutation for Pause / Resume
  const updateStatusMutation = useUpdateEnrollmentStatus();

  // Active or Paused enrollment
  const currentEnrollment = React.useMemo(() => {
    return (
      enrollments.find((e) => e.status === "ACTIVE" || e.status === "PAUSED") ||
      null
    );
  }, [enrollments]);

  // Completed or Cancelled enrollments
  const pastEnrollments = React.useMemo(() => {
    return enrollments.filter(
      (e) => e.status !== "ACTIVE" && e.status !== "PAUSED",
    );
  }, [enrollments]);

  // Handle Pause / Resume toggle
  const handleToggleStatus = async () => {
    if (!currentEnrollment) return;
    const isCurrentlyActive = currentEnrollment.status === "ACTIVE";
    const nextStatus = isCurrentlyActive ? "PAUSED" : "ACTIVE";

    try {
      setStatusFeedback(null);
      await updateStatusMutation.mutateAsync({
        id: currentEnrollment.id,
        status: nextStatus,
        leadId: lead.id,
      });
      setStatusFeedback(
        isCurrentlyActive
          ? "Đã tạm dừng chuỗi chăm sóc thành công"
          : "Đã kích hoạt lại chuỗi chăm sóc thành công",
      );
      setTimeout(() => setStatusFeedback(null), 4000);
    } catch {
      setStatusFeedback("Cập nhật trạng thái chuỗi thất bại");
    }
  };

  // Step Calculation
  const totalSteps = Math.max(
    currentEnrollment?.sequence?.steps?.length || 1,
    currentEnrollment?.currentStep?.stepOrder || 1,
  );
  const currentStepOrder =
    currentEnrollment?.currentStep?.stepOrder ||
    currentEnrollment?.currentStepOrder ||
    1;
  const progressPercent = Math.min(
    100,
    Math.max(5, Math.round((currentStepOrder / totalSteps) * 100)),
  );

  if (isLoading) {
    return (
      <Card className="border-[#e2e8e4] bg-white shadow-xs">
        <CardContent className="p-6 flex items-center justify-center gap-2 text-xs text-gray-500">
          <span className="size-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <span>Đang tải thông tin chuỗi chăm sóc...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[#e2e8e4] bg-white shadow-xs overflow-hidden">
      {/* Header */}
      <CardHeader className="border-b border-[#edf0ee] px-6 py-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
            <Clock className="size-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-gray-900">
              Chuỗi chăm sóc khách hàng (Follow-Up Cadences)
            </CardTitle>
            <p className="text-[11px] text-gray-500">
              UC05 Multi-Touch Automated Outreach
            </p>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => setIsEnrollModalOpen(true)}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs h-8 shadow-2xs gap-1"
        >
          <Plus className="size-3.5" />
          Enroll in Sequence
        </Button>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        {/* Status update feedback alert */}
        {statusFeedback && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-900 flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span>{statusFeedback}</span>
          </div>
        )}

        {/* Case 1: Active or Paused Enrollment Card */}
        {currentEnrollment ? (
          <div
            className={cn(
              "rounded-2xl border-2 p-5 shadow-xs space-y-4 transition-colors",
              currentEnrollment.status === "PAUSED"
                ? "border-amber-400/70 bg-gradient-to-br from-amber-50/40 via-white to-white"
                : "border-emerald-500/60 bg-gradient-to-br from-emerald-50/50 via-white to-white",
            )}
          >
            {/* Top row: Title, status, actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      currentEnrollment.status === "PAUSED"
                        ? "text-amber-700"
                        : "text-emerald-700",
                    )}
                  >
                    {currentEnrollment.status === "PAUSED"
                      ? "Chuỗi đang tạm dừng"
                      : "Chuỗi đang hoạt động"}
                  </span>
                  <EnrollmentStatusBadge status={currentEnrollment.status} />
                </div>
                <h4 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                  <Link
                    href={`/follow-ups/sequences/${currentEnrollment.sequenceId}`}
                    className="hover:text-emerald-800 hover:underline flex items-center gap-1"
                  >
                    {currentEnrollment.sequence?.name || "Outreach Cadence"}
                    <ExternalLink className="size-3 text-gray-400" />
                  </Link>
                </h4>
              </div>

              {/* Action Buttons: Pause / Resume & Cancel */}
              <div className="flex items-center gap-2">
                {/* Pause / Resume Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleToggleStatus}
                  disabled={updateStatusMutation.isPending}
                  className={cn(
                    "h-8 text-xs font-semibold gap-1",
                    currentEnrollment.status === "PAUSED"
                      ? "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                      : "text-amber-700 border-amber-200 hover:bg-amber-50",
                  )}
                >
                  {updateStatusMutation.isPending ? (
                    <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : currentEnrollment.status === "PAUSED" ? (
                    <>
                      <PlayCircle className="size-3.5 text-emerald-600" />
                      Tiếp tục (Resume)
                    </>
                  ) : (
                    <>
                      <PauseCircle className="size-3.5 text-amber-600" />
                      Tạm dừng (Pause)
                    </>
                  )}
                </Button>

                {/* Cancel Sequence Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEnrollmentToCancel(currentEnrollment)}
                  className="h-8 text-xs text-rose-700 border-rose-200 hover:bg-rose-50 font-semibold"
                >
                  <Ban className="size-3 mr-1" />
                  Hủy chuỗi (Cancel)
                </Button>

                <Button
                  asChild
                  size="sm"
                  className="h-8 text-xs bg-[#17221c] hover:bg-[#253930] text-white font-semibold shadow-xs"
                >
                  <Link href={`/follow-ups/${currentEnrollment.id}`}>
                    <Clock className="size-3 mr-1" />
                    Lịch sử thực thi
                    <ArrowRight className="size-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Current Step Section & Progress Bar */}
            <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Bước hiện tại (Current Step Indicator)
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex size-6 items-center justify-center rounded-md bg-emerald-800 text-white font-bold text-xs">
                      #{currentStepOrder}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-gray-900 truncate">
                        Bước {currentStepOrder}/{totalSteps}:{" "}
                        {currentEnrollment.currentStep?.actionType ||
                          "SEND_EMAIL"}{" "}
                        {currentEnrollment.currentStep?.subjectTemplate && (
                          <span className="font-normal text-gray-600">
                            - &ldquo;{currentEnrollment.currentStep.subjectTemplate}&rdquo;
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {currentEnrollment.currentStep
                          ? formatDelayDescription(
                              currentEnrollment.currentStep.delayMinutes,
                              currentEnrollment.currentStep.stepOrder,
                            )
                          : "Immediate"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                      Kênh tương tác
                    </span>
                    <ChannelBadge
                      channel={currentEnrollment.currentStep?.channel || "EMAIL"}
                    />
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                      Ngày ghi danh
                    </span>
                    <p className="text-xs font-semibold text-gray-700">
                      {currentEnrollment.startedAt
                        ? new Date(currentEnrollment.startedAt).toLocaleDateString()
                        : "Gần đây"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mini Progress Bar */}
              <div className="space-y-1 pt-1 border-t border-gray-100">
                <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600">
                  <span>Tiến độ thực hiện chuỗi</span>
                  <span>
                    {currentStepOrder}/{totalSteps} bước ({progressPercent}%)
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all duration-500",
                      currentEnrollment.status === "PAUSED"
                        ? "bg-amber-500"
                        : "bg-emerald-600",
                    )}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Case 2: Empty State */
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 p-6 text-center space-y-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500 mx-auto">
              <PlayCircle className="size-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-gray-800">
                Chưa có chuỗi chăm sóc nào được kích hoạt
              </h4>
              <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                Ghi danh Lead này vào chuỗi chăm sóc tự động (Email, Cuộc gọi, Tin nhắn) để thúc đẩy tương tác và chuyển đổi.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => setIsEnrollModalOpen(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold h-8"
            >
              <Plus className="size-3 mr-1" />
              Enroll ngay
            </Button>
          </div>
        )}

        {/* Past Enrollments History */}
        {pastEnrollments.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center justify-between w-full text-xs font-bold text-gray-600 hover:text-gray-900"
            >
              <span className="flex items-center gap-1.5">
                <History className="size-3.5 text-gray-400" />
                Lịch sử các chuỗi trước đó ({pastEnrollments.length})
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold">
                {showHistory ? "Thu gọn" : "Xem chi tiết"}
              </span>
            </button>

            {showHistory && (
              <div className="space-y-2">
                {pastEnrollments.map((enr) => (
                  <div
                    key={enr.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50/40 p-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">
                          {enr.sequence?.name || "Chuỗi chăm sóc"}
                        </span>
                        <EnrollmentStatusBadge status={enr.status} />
                      </div>
                      <p className="text-[11px] text-gray-500">
                        Ghi danh:{" "}
                        {enr.startedAt
                          ? new Date(enr.startedAt).toLocaleDateString()
                          : "N/A"}
                        {enr.cancelledAt && (
                          <span>
                            {" "}&bull; Đã hủy:{" "}
                            {new Date(enr.cancelledAt).toLocaleDateString()}
                            {enr.cancellationReason &&
                              ` (${enr.cancellationReason})`}
                          </span>
                        )}
                        {enr.completedAt && (
                          <span>
                            {" "}&bull; Hoàn thành:{" "}
                            {new Date(enr.completedAt).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>

                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="text-xs text-gray-600 hover:text-gray-900 h-7"
                    >
                      <Link href={`/follow-ups/${enr.id}`}>
                        Chi tiết <ArrowRight className="size-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Enroll Modal */}
      <LeadEnrollmentModal
        lead={lead}
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        onSuccess={() => refetch()}
      />

      {/* Cancel Confirmation Dialog */}
      {enrollmentToCancel && (
        <CancelEnrollmentDialog
          enrollment={enrollmentToCancel}
          isOpen={Boolean(enrollmentToCancel)}
          onClose={() => setEnrollmentToCancel(null)}
          onCancelled={() => refetch()}
        />
      )}
    </Card>
  );
}

// Alias for backward compatibility
export const LeadEnrollmentsWidget = LeadActiveSequencesWidget;
