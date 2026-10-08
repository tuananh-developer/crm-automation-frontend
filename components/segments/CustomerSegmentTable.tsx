"use client";

import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState, ErrorState, LoadingState } from "./States";
import { ConfidenceBar, formatDateTime } from "./segment-utils";
import { ASSIGNMENT_TYPE_LABELS } from "@/types/segment";
import type {
  CustomerSegmentAssignment,
  SegmentAssignmentType,
  SegmentListMeta,
} from "@/types/segment";

type CustomerSegmentTableProps = {
  assignments: CustomerSegmentAssignment[];
  isLoading: boolean;
  error: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  assignmentFilter: "ALL" | SegmentAssignmentType;
  onAssignmentFilterChange: (value: "ALL" | SegmentAssignmentType) => void;
  meta?: SegmentListMeta;
  page: number;
  onPageChange: (page: number) => void;
  onRetry: () => void;
};

/** Renders `customer_segments` rows exactly as stored in the backend. */
export function CustomerSegmentTable({
  assignments,
  isLoading,
  error,
  search,
  onSearchChange,
  assignmentFilter,
  onAssignmentFilterChange,
  meta,
  page,
  onPageChange,
  onRetry,
}: CustomerSegmentTableProps) {
  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? assignments.length;

  // The API filters by page/limit/search only, so the assignment type filter
  // runs on the rows of the current page.
  const visibleAssignments =
    assignmentFilter === "ALL"
      ? assignments
      : assignments.filter(
          (assignment) => assignment.assignmentType === assignmentFilter,
        );

  return (
    <Card>
      <CardContent className="space-y-4 p-0">
        <div className="flex flex-col gap-3 border-b border-[#edf0ee] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-bold text-[#17221c]">Customers in segment</h3>
            <p className="text-sm text-gray-500">
              Assignments stored in <code>customer_segments</code>
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative sm:w-56">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                className="pl-9"
                placeholder="Search customers…"
                value={search}
                aria-label="Search customers in segment"
                onChange={(event) => onSearchChange(event.target.value)}
              />
            </div>

            <Select
              className="sm:w-36"
              value={assignmentFilter}
              aria-label="Filter by assignment type"
              onChange={(event) =>
                onAssignmentFilterChange(
                  event.target.value as "ALL" | SegmentAssignmentType,
                )
              }
            >
              <option value="ALL">All types</option>
              <option value="MANUAL">MANUAL</option>
              <option value="RULE">RULE_BASED</option>
              <option value="AI">AI_ASSIGNED</option>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <LoadingState label="Loading customers…" />
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : visibleAssignments.length === 0 ? (
          <EmptyState
            title="No customer assigned yet"
            description="Run an evaluation to assign customers to this segment."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[64rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#edf0ee] text-left text-xs uppercase tracking-wide text-gray-400">
                    <th className="px-5 py-3 font-semibold">Customer</th>
                    <th className="px-5 py-3 font-semibold">Email</th>
                    <th className="px-5 py-3 font-semibold">Company</th>
                    <th className="px-5 py-3 font-semibold">Score</th>
                    <th className="px-5 py-3 font-semibold">
                      Assignment type
                    </th>
                    <th className="px-5 py-3 font-semibold">Confidence</th>
                    <th className="px-5 py-3 font-semibold">
                      Assignment reason
                    </th>
                    <th className="px-5 py-3 font-semibold">Assigned at</th>
                    <th className="px-5 py-3 font-semibold">Assigned by</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f1f4f2]">
                  {visibleAssignments.map((assignment) => (
                    <tr key={`${assignment.customerId}-${assignment.segmentId}`} className="hover:bg-[#f6f8f7]">
                      <td className="px-5 py-4 font-semibold text-[#17221c]">
                        {assignment.customer?.name ?? assignment.customerId}
                      </td>

                      <td className="px-5 py-4 text-xs text-gray-600">
                        {assignment.customer?.email ?? "—"}
                      </td>

                      <td className="px-5 py-4 text-xs text-gray-600">
                        {assignment.customer?.companyName ?? "—"}
                      </td>

                      <td className="px-5 py-4 text-xs text-gray-600">
                        {assignment.score ?? "—"}
                      </td>

                      <td className="px-5 py-4">
                        <Badge
                          tone={assignment.assignmentType === "AI" ? "info" : "neutral"}
                        >
                          {ASSIGNMENT_TYPE_LABELS[assignment.assignmentType] ?? assignment.assignmentType}
                        </Badge>
                      </td>

                      <td className="px-5 py-4">
                        <ConfidenceBar value={assignment.confidence} />
                      </td>

                      <td className="max-w-xs px-5 py-4 text-xs text-gray-600">
                        {assignment.assignedReason ?? "—"}
                      </td>

                      <td className="px-5 py-4 text-xs text-gray-500">
                        {formatDateTime(assignment.assignedAt)}
                      </td>

                      <td className="px-5 py-4 text-xs text-gray-500">
                        {assignment.assignedByUser?.name ??
                          assignment.assignedBy ??
                          "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-[#edf0ee] px-5 py-3">
              <p className="text-xs text-gray-500">
                Page {page} of {totalPages} · {total} assignments
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => onPageChange(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => onPageChange(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}