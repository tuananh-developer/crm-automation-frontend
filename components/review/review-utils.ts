import {
  CheckCircle2,
  CirclePlay,
  ClipboardCheck,
  PencilLine,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import type { BadgeTone } from "@/components/ui/badge";

import type {
  ReviewDecision,
  ReviewStatus,
  ReviewTask,
} from "@/types/review";

type ToneConfig = {
  label: string;
  tone: BadgeTone;
  icon: LucideIcon;
};

/**
 * Vietnamese labels for `ReviewStatus`.
 * APPROVED / REJECTED exist in the backend enum but ReviewService only ever
 * writes RESOLVED; they are mapped anyway so an unexpected value still renders.
 */
export const REVIEW_STATUS_CONFIG: Record<ReviewStatus, ToneConfig> = {
  PENDING: { label: "CHỜ REVIEW", tone: "warning", icon: ClipboardCheck },
  IN_REVIEW: { label: "ĐANG REVIEW", tone: "info", icon: CirclePlay },
  APPROVED: { label: "ĐÃ DUYỆT", tone: "success", icon: CheckCircle2 },
  REJECTED: { label: "BÁN TỪ CHỐI", tone: "danger", icon: XCircle },
  RESOLVED: { label: "ĐÃ XỬ LÝ", tone: "success", icon: CheckCircle2 },
};

export const REVIEW_DECISION_CONFIG: Record<ReviewDecision, ToneConfig> = {
  APPROVE: { label: "DUYỆT", tone: "success", icon: CheckCircle2 },
  REJECT: { label: "TỪ CHỐI", tone: "danger", icon: XCircle },
  MODIFY: { label: "CHỈNH SỬA", tone: "warning", icon: PencilLine },
};

/** `ReviewService.updateLeadAfterReview` maps a decision onto the lead status. */
export const LEAD_STATUS_BY_DECISION: Record<ReviewDecision, string> = {
  APPROVE: "QUALIFIED",
  REJECT: "LOST",
  MODIFY: "QUALIFYING",
};

/** ReviewService.resolve rejects everything that is not IN_REVIEW. */
export const REVIEW_STATUS_OPTIONS: ReviewStatus[] = [
  "PENDING",
  "IN_REVIEW",
  "RESOLVED",
];

/**
 * The backend exposes no priority column, so the inbox is ordered by status
 * urgency first and by age (oldest first) inside each group.
 */
const STATUS_PRIORITY: Record<ReviewStatus, number> = {
  PENDING: 0,
  IN_REVIEW: 1,
  APPROVED: 2,
  REJECTED: 2,
  RESOLVED: 2,
};

export function sortReviewTasksByPriority(tasks: ReviewTask[]): ReviewTask[] {
  return [...tasks].sort((left, right) => {
    const priorityDiff =
      (STATUS_PRIORITY[left.status] ?? 3) - (STATUS_PRIORITY[right.status] ?? 3);

    if (priorityDiff !== 0) return priorityDiff;

    const leftTime = new Date(left.createdAt).getTime();
    const rightTime = new Date(right.createdAt).getTime();

    if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) return 0;

    return leftTime - rightTime;
  });
}

/** REJECT and MODIFY must carry a reviewer comment (frontend-side rule). */
export function decisionRequiresComment(decision: ReviewDecision): boolean {
  return decision === "REJECT" || decision === "MODIFY";
}

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

export function getLeadName(lead?: ReviewTask["lead"]): string {
  if (!lead) return "Không rõ lead";

  const fullName = [lead.firstName, lead.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || lead.email;
}

/** Distinct reviewers that the API already exposes through `assignee`. */
export type ReviewReviewerOption = NonNullable<ReviewTask["assignee"]>;

export function collectReviewers(tasks: ReviewTask[]): ReviewReviewerOption[] {
  const byId = new Map<string, ReviewReviewerOption>();

  for (const task of tasks) {
    if (task.assignee && !byId.has(task.assignee.id)) {
      byId.set(task.assignee.id, task.assignee);
    }
  }

  return [...byId.values()].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}
