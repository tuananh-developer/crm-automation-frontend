"use client";

import * as React from "react";
import { Hand, Loader2, UserRoundCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { ReviewReviewer, ReviewTask } from "@/types/review";

type ClaimReviewTaskButtonProps = {
  task: ReviewTask;
  /** Reviewers discovered from the API (`assignee` relations). */
  reviewers: ReviewReviewer[];
  pending: boolean;
  onClaim: (task: ReviewTask, reviewerId: string) => void;
};

/**
 * Claim (assign) a review task.
 * Backend: PATCH /review-tasks/:id/assign { reviewerId } - there is no
 * "current user" concept in the API, so the reviewer is picked explicitly
 * from the users the API already exposes through `assignee`.
 */
export function ClaimReviewTaskButton({
  task,
  reviewers,
  pending,
  onClaim,
}: ClaimReviewTaskButtonProps) {
  const [reviewerId, setReviewerId] = React.useState(task.assignedTo ?? "");

  const isClaimed = Boolean(task.assignedTo && task.assignee);

  if (reviewers.length === 0) {
    return (
      <p className="text-xs text-gray-500">
        Chưa có reviewer nào trong danh sách. Backend chưa có API lấy danh sách
        user, nên hãy phân công qua tài khoản quản trị.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      {isClaimed ? (
        <Badge tone="info" className="w-fit">
          <UserRoundCheck />
          {task.assignee?.name}
        </Badge>
      ) : null}

      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <Select
          className="sm:max-w-56"
          aria-label="Chọn reviewer"
          value={reviewerId}
          disabled={pending}
          onChange={(event) => setReviewerId(event.target.value)}
        >
          <option value="">— Chọn reviewer —</option>
          {reviewers.map((reviewer) => (
            <option key={reviewer.id} value={reviewer.id}>
              {reviewer.name} ({reviewer.role})
            </option>
          ))}
        </Select>

        <Button
          type="button"
          variant={isClaimed ? "outline" : "default"}
          disabled={pending || !reviewerId || reviewerId === task.assignedTo}
          onClick={() => onClaim(task, reviewerId)}
        >
          {pending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Hand />
          )}
          {pending
            ? "Đang phân công…"
            : isClaimed
              ? "Đổi người phụ trách"
              : "Nhận task"}
        </Button>
      </div>
    </div>
  );
}
