import { cn } from "@/lib/utils";
import {
  SEGMENT_CRITERIA_FIELDS,
  SEGMENT_OPERATORS,
  type SegmentAssignmentType,
  type SegmentCriteria,
  type SegmentEvaluationResult,
} from "@/types/segment";

export function formatDateTime(value?: string | null): string {
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

/**
 * `customer_segments.confidence` is numeric(5,4), so the postgres driver
 * hands it over as a string ("0.9500"). Accept both shapes.
 */
export function toConfidenceNumber(
  value?: string | number | null,
): number | null {
  if (value === null || value === undefined || value === "") return null;

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

export function formatConfidence(value?: string | number | null): string {
  const parsed = toConfidenceNumber(value);

  if (parsed === null) return "—";

  const normalised = parsed > 1 ? parsed / 100 : parsed;

  return `${Math.round(normalised * 100)}%`;
}

export function getSegmentAssignmentType(
  criteria?: SegmentCriteria | null,
): SegmentAssignmentType {
  return criteria?.assignmentType ?? "RULE";
}

/** Human readable one-line summary of a criteria document. */
export function describeCriteria(criteria?: SegmentCriteria | null): string {
  if (!criteria || criteria.conditions.length === 0) {
    return "No criteria defined";
  }

  return criteria.conditions
    .map((condition) => {
      const meta = SEGMENT_CRITERIA_FIELDS.find(
        (field) => field.value === condition.field,
      );
      const operator =
        SEGMENT_OPERATORS.find((item) => item.value === condition.operator)
          ?.label ?? condition.operator;

      return `${meta?.label ?? condition.field} ${operator} ${condition.value}`;
    })
    .join(` ${criteria.logic} `);
}

export function getEvaluationDisplayName(
  result: SegmentEvaluationResult,
): string {
  return result.customerName ?? result.customerId;
}

export function ConfidenceBar({
  value,
  className,
}: {
  value?: string | number | null;
  className?: string;
}) {
  const parsed = toConfidenceNumber(value);

  if (parsed === null) {
    return <span className="text-sm text-gray-400">—</span>;
  }

  const normalised = Math.min(1, Math.max(0, parsed > 1 ? parsed / 100 : parsed));
  const tone =
    normalised >= 0.8
      ? "bg-emerald-500"
      : normalised >= 0.5
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-100">
        <div
          className={cn("h-full rounded-full", tone)}
          style={{ width: `${normalised * 100}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-[#17221c]">
        {formatConfidence(value)}
      </span>
    </div>
  );
}