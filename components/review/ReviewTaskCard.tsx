"use client";

import {
  Building2,
  ChevronRight,
  Flag,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LeadConfidenceBadge } from "./LeadConfidenceBadge";
import {
  ReviewDecisionBadge,
  ReviewStatusBadge,
} from "./ReviewStatusBadge";
import { formatDateTime, getLeadName } from "./review-utils";
import type { ReviewTask } from "@/types/review";

type ReviewTaskCardProps = {
  task: ReviewTask;
  onOpen: (task: ReviewTask) => void;
};

export function ReviewTaskCard({ task, onOpen }: ReviewTaskCardProps) {
  const lead = task.lead;

  return (
    <Card className="transition hover:border-[#173b2b]/40 hover:shadow-md">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-base font-bold text-[#17221c]">
                {getLeadName(lead)}
              </p>

              {lead?.companyName ? (
                <Badge tone="neutral">
                  <Building2 />
                  {lead.companyName}
                </Badge>
              ) : null}
            </div>

            <div className="flex flex-col gap-1 text-xs text-gray-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              {lead?.email ? (
                <span className="inline-flex items-center gap-1 break-all">
                  <Mail className="size-3 shrink-0" />
                  {lead.email}
                </span>
              ) : null}

              {lead?.phone ? (
                <span className="inline-flex items-center gap-1">
                  <Phone className="size-3 shrink-0" />
                  {lead.phone}
                </span>
              ) : null}

              <span className="inline-flex items-center gap-1">
                <UserRound className="size-3 shrink-0" />
                Lead:{" "}
                <span className="font-mono">{task.leadId.slice(0, 8)}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <ReviewStatusBadge status={task.status} />
            <ReviewDecisionBadge decision={task.decision} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <LeadConfidenceBadge leadId={task.leadId} />

          <Badge tone="neutral">
            <Flag />
            {task.assignee?.name ?? "Chưa phân công"}
          </Badge>

          <span className="text-xs text-gray-500">
            Tạo lúc {formatDateTime(task.createdAt)}
          </span>
        </div>

        <div className="rounded-xl border border-[#e2e8e4] bg-[#f6f8f7] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Lý do review
          </p>
          <p className="mt-1 text-sm leading-relaxed break-words text-[#17221c]">
            {task.reason ?? "Không có lý do được ghi nhận."}
          </p>
        </div>

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={() => onOpen(task)}>
            Mở chi tiết
            <ChevronRight />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
