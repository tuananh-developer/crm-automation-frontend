"use client";

import { Bot, CheckCircle2, TriangleAlert, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ConfidenceBar, formatConfidence, formatDateTime } from "./segment-utils";
import { ASSIGNMENT_TYPE_LABELS } from "@/types/segment";
import type {
  EvaluationStatus,
  SegmentEvaluationResult,
} from "@/types/segment";

const statusConfig: Record<
  EvaluationStatus,
  { label: string; tone: "neutral" | "info" | "success" | "danger" }
> = {
  PENDING: { label: "Pending", tone: "neutral" },
  PROCESSING: { label: "Processing", tone: "info" },
  COMPLETED: { label: "Completed", tone: "success" },
  FAILED: { label: "Failed", tone: "danger" },
};

export function EvaluationStatusBadge({
  status,
}: {
  status: EvaluationStatus;
}) {
  const config = statusConfig[status];

  return <Badge tone={config.tone}>{config.label}</Badge>;
}

/** Single customer evaluation outcome (UC09 requirement: evaluation result). */
export function EvaluateResult({
  result,
  segmentNames,
}: {
  result: SegmentEvaluationResult;
  segmentNames?: Record<string, string>;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-[#e2e8e4] bg-[#f6f8f7] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-[#edf4ef] p-2 text-[#173b2b]">
            <UserRound className="size-4" />
          </div>
          <p className="font-semibold text-[#17221c]">
            {result.customerName ?? result.customerId}
          </p>
        </div>

        {result.status ? <EvaluationStatusBadge status={result.status} /> : null}
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Segment
          </dt>
          <dd className="mt-1 text-sm text-[#17221c]">
            {
              result.segmentName ??
              segmentNames?.[result.segmentId] ??
              result.segmentId
            }
          </dd>
        </div>

        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Assignment type
          </dt>
          <dd className="mt-1">
            <Badge
              tone={result.assignmentType === "AI" ? "info" : "neutral"}
              className="gap-1"
            >
              {result.assignmentType === "AI" ? <Bot className="size-3" /> : null}
              {ASSIGNMENT_TYPE_LABELS[result.assignmentType] ?? result.assignmentType}
            </Badge>
          </dd>
        </div>

        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Confidence
          </dt>
          <dd className="mt-1">
            <ConfidenceBar value={result.confidence} />
          </dd>
        </div>

        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Assigned at
          </dt>
          <dd className="mt-1 text-sm text-[#17221c]">
            {formatDateTime(result.assignedAt)}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Assigned by
          </dt>
          <dd className="mt-1 text-sm text-[#17221c]">
            {result.assignedByUser?.name ?? result.assignedBy ?? "System"}
          </dd>
        </div>

        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Assignment reason
          </dt>
          <dd className="mt-1 text-sm text-[#17221c]">
            {result.assignmentReason ?? "No reason provided by the backend."}
          </dd>
        </div>
      </dl>

      <p className="border-t border-[#e2e8e4] pt-3 text-xs text-gray-500">
        Raw confidence value: {formatConfidence(result.confidence)}
      </p>
    </div>
  );
}

export function EvaluateResultList({
  results,
  segmentNames,
}: {
  results: SegmentEvaluationResult[];
  segmentNames?: Record<string, string>;
}) {
  if (results.length === 0) return null;

  return (
    <div className="space-y-3">
      {results.map((result, index) => (
        <EvaluateResult
          key={`${result.customerId}-${result.segmentId}-${index}`}
          result={result}
          segmentNames={segmentNames}
        />
      ))}
    </div>
  );
}

export function EvaluateOutcomeMessage({
  status,
  message,
}: {
  status: EvaluationStatus;
  message?: string;
}) {
  if (status === "COMPLETED") {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
        <CheckCircle2 className="size-4" />
        {message ?? "Evaluation completed."}
      </p>
    );
  }

  if (status === "FAILED") {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-red-600">
        <TriangleAlert className="size-4" />
        {message ?? "Evaluation failed."}
      </p>
    );
  }

  return (
    <p className="text-sm font-medium text-gray-500">
      {message ?? "Waiting for the backend result…"}
    </p>
  );
}