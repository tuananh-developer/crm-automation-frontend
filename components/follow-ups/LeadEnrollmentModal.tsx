"use client";

import * as React from "react";
import Link from "next/link";
import {
  X,
  UserPlus,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ChannelBadge } from "./ChannelBadge";
import { formatDelayDescription } from "@/lib/delay-utils";
import {
  useActiveSequences,
  useLeadEnrollments,
  useEnrollLead,
} from "@/hooks/use-enrollment";
import type { Lead } from "@/types/lead";

export interface LeadEnrollmentModalProps {
  lead: Pick<Lead, "id" | "firstName" | "lastName" | "companyName" | "email"> & {
    status?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Modal ghi danh Lead vào Follow-Up Sequence (FE-07 UC05).
 * - Dropdown chỉ hiển thị Sequence có isActive === true.
 * - Hiển thị Sequence Summary (Total Steps, Estimated Duration).
 * - Cảnh báo Duplicate Enrollment và Disable nút Confirm nếu đang có sequence ACTIVE.
 * - Confirm Button gọi API enroll kèm Loading state và thông báo Toast/Alert thành công.
 */
export function LeadEnrollmentModal({
  lead,
  isOpen,
  onClose,
  onSuccess,
}: LeadEnrollmentModalProps) {
  // 1. Fetch only ACTIVE sequences via useActiveSequences hook
  const { data: rawSequences = [], isLoading: isSequencesLoading } =
    useActiveSequences();

  // Filter to guarantee only active sequences are selectable
  const sequences = React.useMemo(() => {
    return rawSequences.filter(
      (s) => s.status === "ACTIVE" || (s.isActive !== false && (s.status as string) !== "ARCHIVED"),
    );
  }, [rawSequences]);

  // 2. Fetch current enrollments for this lead to check duplicates
  const { data: leadEnrollments = [], isLoading: isEnrollmentsLoading } =
    useLeadEnrollments(isOpen ? lead.id : undefined);

  // 3. Mutation hook for enrollment
  const enrollMutation = useEnrollLead();

  const [selectedSequenceId, setSelectedSequenceId] = React.useState<string>("");
  const [createdEnrollmentId, setCreatedEnrollmentId] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Set default selected sequence
  const effectiveSequenceId =
    selectedSequenceId || (sequences.length > 0 ? sequences[0].id : "");

  const activeSequence = React.useMemo(() => {
    return sequences.find((s) => s.id === effectiveSequenceId) || null;
  }, [sequences, effectiveSequenceId]);

  // Check duplicate active enrollment
  const isDuplicateActive = React.useMemo(() => {
    if (!effectiveSequenceId) return false;
    return leadEnrollments.some(
      (enr) => enr.sequenceId === effectiveSequenceId && enr.status === "ACTIVE",
    );
  }, [leadEnrollments, effectiveSequenceId]);

  // Active enrollment details if duplicate
  const activeEnrollmentMatch = React.useMemo(() => {
    if (!effectiveSequenceId) return null;
    return leadEnrollments.find(
      (enr) => enr.sequenceId === effectiveSequenceId && enr.status === "ACTIVE",
    );
  }, [leadEnrollments, effectiveSequenceId]);

  // Calculate estimated total cadence duration
  const totalEstimatedDuration = React.useMemo(() => {
    if (!activeSequence?.steps || activeSequence.steps.length === 0)
      return "0 phút";
    const totalMins = activeSequence.steps.reduce(
      (sum, s) => sum + (s.delayMinutes || 0),
      0,
    );
    if (totalMins === 0) return "Gửi ngay lập tức (Immediate)";
    if (totalMins >= 1440) {
      const days = (totalMins / 1440).toFixed(1);
      return `~${days} ngày tổng cộng`;
    }
    const hours = (totalMins / 60).toFixed(1);
    return `~${hours} giờ tổng cộng`;
  }, [activeSequence]);

  const handleEnrollConfirm = async () => {
    if (!effectiveSequenceId) {
      setErrorMessage("Vui lòng chọn một chuỗi chăm sóc đang kích hoạt");
      return;
    }
    if (isDuplicateActive) {
      setErrorMessage(
        "Lead này hiện đang chạy trong Sequence này. Không thể ghi danh trùng lặp!",
      );
      return;
    }

    try {
      setErrorMessage(null);
      const res = await enrollMutation.mutateAsync({
        leadId: lead.id,
        sequenceId: effectiveSequenceId,
        assignedBy: (lead as { ownerId?: string }).ownerId,
      });
      setCreatedEnrollmentId(res.id);
      onSuccess?.();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Ghi danh Lead vào chuỗi thất bại";
      setErrorMessage(msg);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl border border-gray-200 space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <UserPlus className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Ghi danh Lead vào Chuỗi chăm sóc (Enroll in Sequence)
              </h3>
              <p className="text-xs text-gray-500">
                UC05 Follow-Up Sequence Automation
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="size-8 p-0 text-gray-400 hover:text-gray-700"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Lead Profile Target Strip */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-gray-900 block text-sm">
              {lead.firstName} {lead.lastName}
            </span>
            <span className="text-gray-500">
              {lead.companyName} &bull; {lead.email}
            </span>
          </div>
          <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-gray-700 border border-gray-200 shadow-2xs">
            {lead.status || "Lead"}
          </span>
        </div>

        {/* Success View */}
        {createdEnrollmentId ? (
          <div className="space-y-4 py-2">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-emerald-950">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Ghi danh Lead thành công!</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Bước 1 của chuỗi &ldquo;{activeSequence?.name}&rdquo; đã được
                kích hoạt và đẩy vào hàng đợi RabbitMQ. Các bước tiếp theo sẽ
                tự động gửi theo cấu hình delay.
              </p>
            </div>

            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200 text-xs">
              <span className="text-gray-600 font-medium">
                Theo dõi tiến độ gửi tin:
              </span>
              <Button
                asChild
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-8"
              >
                <Link href={`/follow-ups/${createdEnrollmentId}`}>
                  <Clock className="size-3 mr-1" />
                  Xem lịch sử thực thi
                  <ArrowRight className="size-3 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs"
              >
                Đóng
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {errorMessage && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-800 flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Sequence Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-gray-700">
                  Chọn Chuỗi chăm sóc (Active Sequence){" "}
                  <span className="text-rose-500">*</span>
                </Label>
                <Link
                  href="/follow-ups"
                  target="_blank"
                  className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <Sliders className="size-3" />
                  Quản lý chuỗi chăm sóc
                </Link>
              </div>

              {isSequencesLoading ? (
                <div className="h-10 rounded-xl border border-gray-200 bg-gray-50 flex items-center px-3 text-xs text-gray-400">
                  Đang tải danh sách chuỗi chăm sóc...
                </div>
              ) : sequences.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-xs text-gray-500 space-y-1">
                  <p>Không có chuỗi chăm sóc nào đang kích hoạt (Active).</p>
                  <p className="text-[11px] text-gray-400">
                    Vui lòng kích hoạt một chuỗi chăm sóc trước khi ghi danh Lead.
                  </p>
                </div>
              ) : (
                <Select
                  value={effectiveSequenceId}
                  onChange={(e) => {
                    setSelectedSequenceId(e.target.value);
                    setErrorMessage(null);
                  }}
                  className="text-xs font-medium"
                >
                  {sequences.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.steps?.length || 0} bước)
                    </option>
                  ))}
                </Select>
              )}
            </div>

            {/* Duplicate Enrollment Warning */}
            {isDuplicateActive && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                  <span>Cảnh báo ghi danh trùng lặp (Duplicate Warning)</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Lead này hiện đang chạy trong Sequence này. Không thể ghi danh trùng lặp!
                  (Đã ghi danh vào{" "}
                  {activeEnrollmentMatch?.startedAt
                    ? new Date(activeEnrollmentMatch.startedAt).toLocaleDateString()
                    : "trước đó"}
                  ). Vui lòng hủy chuỗi hiện tại nếu muốn bắt đầu lại.
                </p>
              </div>
            )}

            {/* Sequence Summary Card */}
            {activeSequence && (
              <div className="rounded-xl border border-[#e2e8e4] bg-[#fafcfa] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-emerald-600" />
                    Thông tin Chuỗi ({activeSequence.name})
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                    <Clock className="size-3 text-gray-400" />
                    <span>
                      Thời gian ước tính: <strong>{totalEstimatedDuration}</strong>
                    </span>
                  </div>
                </div>

                {activeSequence.description && (
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {activeSequence.description}
                  </p>
                )}

                {/* Steps List Preview */}
                <div className="space-y-1.5 border-t border-gray-100 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Các bước thực hiện (Total Steps: {activeSequence.steps?.length || 0})
                    </span>
                  </div>
                  {activeSequence.steps && activeSequence.steps.length > 0 ? (
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                      {activeSequence.steps.map((st) => (
                        <div
                          key={st.id}
                          className="flex items-center justify-between rounded-lg bg-white p-2 border border-gray-200/80 text-xs shadow-2xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="flex size-5 items-center justify-center rounded-md bg-gray-900 text-white font-bold text-[10px]">
                              #{st.stepOrder}
                            </span>
                            <ChannelBadge channel={st.channel} size="sm" />
                            <span className="text-xs font-medium text-gray-800 truncate max-w-[200px]">
                              {st.subjectTemplate || st.actionType}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-500 font-medium">
                            {formatDelayDescription(st.delayMinutes, st.stepOrder)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">
                      Chưa có bước nào được cấu hình
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-xs"
              >
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleEnrollConfirm}
                disabled={
                  enrollMutation.isPending ||
                  isSequencesLoading ||
                  isEnrollmentsLoading ||
                  !effectiveSequenceId ||
                  isDuplicateActive ||
                  sequences.length === 0
                }
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm"
              >
                {enrollMutation.isPending ? "Đang ghi danh..." : "Xác nhận & Ghi danh"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Alias for backward compatibility
export const EnrollInSequenceModal = LeadEnrollmentModal;
