"use client";

import * as React from "react";
import { CheckSquare, Loader2, Play, Search, Square, Users, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { getCustomers } from "@/services/customer.service";
import { Modal } from "./Modal";
import {
  EvaluateOutcomeMessage,
  EvaluateResultList,
  EvaluationStatusBadge,
} from "./EvaluateResult";
import type {
  CustomerSegmentAssignment,
  EvaluationStatus,
  Segment,
  SegmentAssignmentType,
  SegmentEvaluationResult,
} from "@/types/segment";

type EvaluateCustomerDialogProps = {
  open: boolean;
  onClose: () => void;
  segments: Segment[];
  customers?: CustomerSegmentAssignment[];
  initialSegmentId?: string;
  isEvaluating: boolean;
  onEvaluate: (input: {
    segmentId: string;
    customerIds: string[];
    assignmentType: SegmentAssignmentType;
  }) => Promise<SegmentEvaluationResult[]>;
  onEvaluateAll?: (assignmentType: SegmentAssignmentType) => Promise<void>;
};

const assignmentTypes: SegmentAssignmentType[] = ["RULE", "AI"];

/**
 * Enterprise "Evaluate Customer" dialog:
 * 1. 1-Click "Scan All Customers" via backend automation.
 * 2. Visual table/checklist of all workspace customers with search & multi-select.
 */
export function EvaluateCustomerDialog({
  open,
  onClose,
  segments,
  initialSegmentId,
  isEvaluating,
  onEvaluate,
  onEvaluateAll,
}: EvaluateCustomerDialogProps) {
  const [segmentId, setSegmentId] = React.useState(initialSegmentId ?? "");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [assignmentType, setAssignmentType] =
    React.useState<SegmentAssignmentType>("RULE");
  const [status, setStatus] = React.useState<EvaluationStatus>("PENDING");
  const [error, setError] = React.useState<string | null>(null);
  const [results, setResults] = React.useState<SegmentEvaluationResult[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Query all customers in the CRM system (not just those already in the segment)
  const allCustomersQuery = useQuery({
    queryKey: ["customers", { limit: 100 }],
    queryFn: () => getCustomers({ limit: 100 }),
    enabled: open,
  });

  const allCustomers = React.useMemo(
    () => allCustomersQuery.data?.data ?? [],
    [allCustomersQuery.data],
  );

  const filteredCustomers = React.useMemo(() => {
    if (!searchQuery.trim()) return allCustomers;
    const q = searchQuery.toLowerCase().trim();
    return allCustomers.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.companyName?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.industry?.toLowerCase().includes(q),
    );
  }, [allCustomers, searchQuery]);

  const handleSelectAll = () => {
    setSelectedIds(filteredCustomers.map((c) => c.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleEvaluateAll = async () => {
    if (!onEvaluateAll) return;
    setError(null);
    setStatus("PROCESSING");
    try {
      await onEvaluateAll(assignmentType);
      setStatus("COMPLETED");
    } catch (evaluateError) {
      setStatus("FAILED");
      setError(
        evaluateError instanceof Error
          ? evaluateError.message
          : "Đánh giá toàn bộ thất bại.",
      );
    }
  };

  const handleEvaluateSelected = async () => {
    setError(null);

    if (!segmentId) {
      setError("Vui lòng chọn phân khúc.");
      return;
    }

    if (selectedIds.length === 0) {
      setError("Vui lòng tích chọn ít nhất 1 khách hàng từ danh sách.");
      return;
    }

    setStatus("PROCESSING");

    try {
      const response = await onEvaluate({
        segmentId,
        customerIds: selectedIds,
        assignmentType,
      });

      setResults(response);
      setStatus("COMPLETED");
    } catch (evaluateError) {
      setStatus("FAILED");
      setError(
        evaluateError instanceof Error
          ? evaluateError.message
          : "Đánh giá thất bại.",
      );
    }
  };

  const isBusy = isEvaluating || status === "PROCESSING";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Đánh giá & Phân khúc Khách hàng"
      description="Đối soát dữ liệu khách hàng với tiêu chí phân khúc (RULE hoặc AI)."
      className="max-w-2xl"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button
            type="button"
            onClick={handleEvaluateSelected}
            disabled={isBusy || selectedIds.length === 0}
            className="bg-[#059669] hover:bg-[#047857] text-white"
          >
            {isBusy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4 fill-current" />
            )}
            {isBusy
              ? "Đang đánh giá…"
              : `Đánh giá khách hàng đã chọn (${selectedIds.length})`}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Top Configuration Bar: Segment & Assignment Type */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="evaluate-segment" className="text-xs font-semibold text-gray-700">
              Phân khúc mục tiêu
            </Label>
            <Select
              id="evaluate-segment"
              value={segmentId}
              onChange={(event) => {
                setSegmentId(event.target.value);
                setResults([]);
              }}
            >
              <option value="">Chọn phân khúc…</option>
              {segments.map((segment) => (
                <option key={segment.id} value={segment.id}>
                  {segment.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="evaluate-assignment-type" className="text-xs font-semibold text-gray-700">
              Phương thức đánh giá
            </Label>
            <Select
              id="evaluate-assignment-type"
              value={assignmentType}
              onChange={(event) =>
                setAssignmentType(event.target.value as SegmentAssignmentType)
              }
            >
              {assignmentTypes.map((type) => (
                <option key={type} value={type}>
                  {type === "RULE" ? "RULE (Quy tắc tự động)" : "AI (Mô hình AI)"}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* 1-Click Fast Track: Evaluate All Customers */}
        {onEvaluateAll ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 p-3.5">
            <div>
              <h4 className="flex items-center gap-1.5 text-sm font-bold text-emerald-950">
                <Zap className="size-4 text-emerald-600 fill-emerald-600" />
                Quét & Đánh giá toàn bộ khách hàng
              </h4>
              <p className="mt-0.5 text-xs text-emerald-800">
                Tự động đối soát tất cả {allCustomers.length} khách hàng trong CRM và gán ngay vào phân khúc này.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleEvaluateAll}
              disabled={isBusy}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold shrink-0 text-xs h-9 px-4"
            >
              {isBusy ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Play className="size-3.5 fill-current" />
              )}
              Quét toàn bộ ({allCustomers.length})
            </Button>
          </div>
        ) : null}

        {/* Manual Selection: Visual Table / Checklist of All CRM Customers */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-gray-700">
              Hoặc chọn khách hàng cụ thể ({selectedIds.length}/{filteredCustomers.length} đã chọn)
            </Label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="text-xs text-emerald-700 hover:underline font-semibold"
                onClick={handleSelectAll}
              >
                Chọn tất cả
              </button>
              <span className="text-gray-300">•</span>
              <button
                type="button"
                className="text-xs text-gray-500 hover:underline"
                onClick={handleDeselectAll}
              >
                Bỏ chọn
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm theo tên khách hàng, tên công ty, email…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>

          {allCustomersQuery.isLoading ? (
            <div className="flex items-center justify-center py-8 text-xs text-gray-500">
              <Loader2 className="mr-2 size-4 animate-spin text-emerald-600" />
              Đang tải danh sách khách hàng…
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-6 text-center text-xs text-gray-500">
              Không tìm thấy khách hàng nào phù hợp với từ khóa.
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100 bg-white">
              {filteredCustomers.map((customer) => {
                const isChecked = selectedIds.includes(customer.id);
                return (
                  <label
                    key={customer.id}
                    className="flex items-center gap-3 px-3.5 py-2.5 text-xs hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      className="size-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      checked={isChecked}
                      onChange={(event) =>
                        setSelectedIds((previous) =>
                          event.target.checked
                            ? [...previous, customer.id]
                            : previous.filter((id) => id !== customer.id),
                        )
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 font-medium text-gray-900 truncate">
                        <span>{customer.name}</span>
                        {customer.companyName ? (
                          <span className="text-[11px] font-normal text-gray-500 truncate">
                            • {customer.companyName}{" "}
                            {customer.companySize ? `(${customer.companySize} NV)` : ""}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[11px] text-gray-500 truncate">
                        {customer.email}
                      </div>
                    </div>
                    {customer.industry ? (
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 shrink-0 font-medium">
                        {customer.industry}
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Status & Outcome Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#17221c]">
              Trạng thái:
            </span>
            <EvaluationStatusBadge status={status} />
          </div>

          <EvaluateOutcomeMessage
            status={status}
            message={error ?? undefined}
          />

          {results.length > 0 ? <EvaluateResultList results={results} /> : null}
        </div>
      </div>
    </Modal>
  );
}