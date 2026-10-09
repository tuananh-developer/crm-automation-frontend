"use client";

import {
  Building2,
  Mail,
  Pencil,
  Power,
  PowerOff,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SegmentStatusBadge } from "./SegmentStatusBadge";
import {
  describeCriteria,
  formatDateTime,
  getSegmentAssignmentType,
} from "./segment-utils";
import { ASSIGNMENT_TYPE_LABELS } from "@/types/segment";
import type { Segment } from "@/types/segment";

type SegmentDetailProps = {
  segment: Segment;
  customerCount?: number;
  isMutating?: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onEvaluate: () => void;
};

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <div className="text-sm text-[#17221c]">{children}</div>
    </div>
  );
}

export function SegmentDetail({
  segment,
  customerCount,
  isMutating = false,
  onEdit,
  onToggle,
  onDelete,
  onEvaluate,
}: SegmentDetailProps) {
  const assignmentType = getSegmentAssignmentType(segment.criteria);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{segment.name}</CardTitle>
            <CardDescription>
              {segment.description || "No description provided."}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isMutating}
              onClick={onToggle}
            >
              {segment.isActive ? <PowerOff /> : <Power />}
              {segment.isActive ? "Deactivate" : "Activate"}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isMutating}
              onClick={onEdit}
            >
              <Pencil />
              Edit
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isMutating}
              onClick={onEvaluate}
            >
              <Sparkles />
              Evaluate Customer
            </Button>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isMutating}
              onClick={onDelete}
            >
              <Trash2 />
              Delete
            </Button>
          </div>
        </CardHeader>

        <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <DetailRow label="Name">{segment.name}</DetailRow>

          <DetailRow label="Assignment type">
            <Badge tone={assignmentType === "AI" ? "info" : "neutral"}>
              {assignmentType === "AI" ? (
                <Sparkles className="size-3" />
              ) : (
                <Users className="size-3" />
              )}
              {ASSIGNMENT_TYPE_LABELS[assignmentType] ?? assignmentType}
            </Badge>
          </DetailRow>

          <DetailRow label="Status">
            <SegmentStatusBadge isActive={segment.isActive} />
          </DetailRow>

          <DetailRow label="Criteria">
            <span className="block max-w-sm text-xs text-gray-600">
              {describeCriteria(segment.criteria)}
            </span>
          </DetailRow>

          <DetailRow label="Created at">
            {formatDateTime(segment.createdAt)}
          </DetailRow>

          <DetailRow label="Updated at">
            {formatDateTime(segment.updatedAt)}
          </DetailRow>

          <DetailRow label="Created by">
            <span className="inline-flex items-center gap-2">
              <Mail className="size-3.5 text-gray-400" />
              {segment.creator?.name ?? segment.createdBy}
              {segment.creator?.email ? (
                <span className="text-xs text-gray-400">
                  {segment.creator.email}
                </span>
              ) : null}
            </span>
          </DetailRow>

          {typeof customerCount === "number" ? (
            <DetailRow label="Customers">
              <span className="inline-flex items-center gap-2">
                <Building2 className="size-3.5 text-gray-400" />
                {customerCount}
              </span>
            </DetailRow>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}