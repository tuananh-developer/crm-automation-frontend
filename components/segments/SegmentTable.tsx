"use client";

import {
  Eye,
  Pencil,
  Power,
  PowerOff,
  Search,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SegmentStatusBadge } from "./SegmentStatusBadge";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "./States";
import {
  describeCriteria,
  formatDateTime,
  getSegmentAssignmentType,
} from "./segment-utils";
import type { Segment, SegmentListMeta } from "@/types/segment";

type SegmentTableProps = {
  segments: Segment[];
  isLoading: boolean;
  error: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: "ALL" | "ACTIVE" | "INACTIVE";
  onStatusFilterChange: (value: "ALL" | "ACTIVE" | "INACTIVE") => void;
  meta?: SegmentListMeta;
  page: number;
  onPageChange: (page: number) => void;
  onView: (segment: Segment) => void;
  onEdit: (segment: Segment) => void;
  onToggle: (segment: Segment) => void;
  onDelete: (segment: Segment) => void;
  pendingId?: string | null;
  onRetry: () => void;
};

export function SegmentTable({
  segments,
  isLoading,
  error,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  meta,
  page,
  onPageChange,
  onView,
  onEdit,
  onToggle,
  onDelete,
  pendingId,
  onRetry,
}: SegmentTableProps) {
  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? segments.length;

  return (
    <Card>
      <CardContent className="space-y-4 p-0">
        <div className="flex flex-col gap-3 border-b border-[#edf0ee] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search segments…"
              value={search}
              aria-label="Search segments"
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Select
              className="w-40"
              value={statusFilter}
              aria-label="Filter by status"
              onChange={(event) =>
                onStatusFilterChange(
                  event.target.value as "ALL" | "ACTIVE" | "INACTIVE",
                )
              }
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </Select>

            <span className="text-sm text-gray-500">{total} segments</span>
          </div>
        </div>

        {isLoading ? (
          <LoadingState label="Loading segments…" />
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : segments.length === 0 ? (
          <EmptyState
            title="No segments found"
            description={
              search || statusFilter !== "ALL"
                ? "Try a different search term or status filter."
                : "Create your first segment to start grouping customers."
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#edf0ee] text-left text-xs uppercase tracking-wide text-gray-400">
                    <th className="px-5 py-3 font-semibold">Segment</th>
                    <th className="px-5 py-3 font-semibold">Criteria</th>
                    <th className="px-5 py-3 font-semibold">Assignment</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Created</th>
                    <th className="px-5 py-3 font-semibold">Created by</th>
                    <th className="px-5 py-3 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f1f4f2]">
                  {segments.map((segment) => {
                    const isPending = pendingId === segment.id;

                    return (
                      <tr key={segment.id} className="hover:bg-[#f6f8f7]">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-[#17221c]">
                            {segment.name}
                          </p>
                          <p className="mt-0.5 max-w-xs truncate text-xs text-gray-500">
                            {segment.description || "No description"}
                          </p>
                        </td>

                        <td className="max-w-xs px-5 py-4 text-xs text-gray-600">
                          {describeCriteria(segment.criteria)}
                        </td>

                        <td className="px-5 py-4">
                          <Badge
                            tone={
                              getSegmentAssignmentType(segment.criteria) === "AI"
                                ? "info"
                                : "neutral"
                            }
                          >
                            {getSegmentAssignmentType(segment.criteria)}
                          </Badge>
                        </td>

                        <td className="px-5 py-4">
                          <SegmentStatusBadge isActive={segment.isActive} />
                        </td>

                        <td className="px-5 py-4 text-xs text-gray-500">
                          {formatDateTime(segment.createdAt)}
                        </td>

                        <td className="px-5 py-4 text-xs text-gray-500">
                          {segment.creator?.name ?? segment.createdBy}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`View ${segment.name}`}
                              onClick={() => onView(segment)}
                            >
                              <Eye />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Edit ${segment.name}`}
                              onClick={() => onEdit(segment)}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={isPending}
                              aria-label={
                                segment.isActive
                                  ? `Deactivate ${segment.name}`
                                  : `Activate ${segment.name}`
                              }
                              onClick={() => onToggle(segment)}
                            >
                              {segment.isActive ? (
                                <PowerOff />
                              ) : (
                                <Power />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={isPending}
                              aria-label={`Delete ${segment.name}`}
                              onClick={() => onDelete(segment)}
                            >
                              <Trash2 className="text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-[#f1f4f2] lg:hidden">
              {segments.map((segment) => (
                <li key={segment.id} className="space-y-3 px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#17221c]">
                        {segment.name}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {segment.description || "No description"}
                      </p>
                    </div>

                    <SegmentStatusBadge isActive={segment.isActive} />
                  </div>

                  <p className="text-xs text-gray-600">
                    {describeCriteria(segment.criteria)}
                  </p>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-400">
                      {formatDateTime(segment.createdAt)}
                    </span>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`View ${segment.name}`}
                        onClick={() => onView(segment)}
                      >
                        <Eye />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Edit ${segment.name}`}
                        onClick={() => onEdit(segment)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={
                          segment.isActive
                            ? `Deactivate ${segment.name}`
                            : `Activate ${segment.name}`
                        }
                        onClick={() => onToggle(segment)}
                      >
                        {segment.isActive ? <PowerOff /> : <Power />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete ${segment.name}`}
                        onClick={() => onDelete(segment)}
                      >
                        <Trash2 className="text-red-500" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between gap-3 border-t border-[#edf0ee] px-5 py-3">
              <p className="text-xs text-gray-500">
                Page {page} of {totalPages}
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