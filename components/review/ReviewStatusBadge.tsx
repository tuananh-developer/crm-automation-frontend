"use client";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import {
  REVIEW_DECISION_CONFIG,
  REVIEW_STATUS_CONFIG,
} from "./review-utils";
import type { ReviewDecision, ReviewStatus } from "@/types/review";

export function ReviewStatusBadge({
  status,
  className,
}: {
  status?: ReviewStatus | string;
  className?: string;
}) {
  const resolved = (status ?? "PENDING") as ReviewStatus;
  const config = REVIEW_STATUS_CONFIG[resolved] ?? {
    label: resolved,
    tone: "neutral" as BadgeTone,
    icon: REVIEW_STATUS_CONFIG.PENDING.icon,
  };
  const Icon = config.icon;

  return (
    <Badge tone={config.tone} className={className}>
      <Icon />
      {config.label}
    </Badge>
  );
}

export function ReviewDecisionBadge({
  decision,
  className,
}: {
  decision?: ReviewDecision | null;
  className?: string;
}) {
  if (!decision) return null;

  const config = REVIEW_DECISION_CONFIG[decision] ?? {
    label: decision,
    tone: "neutral" as BadgeTone,
    icon: REVIEW_DECISION_CONFIG.APPROVE.icon,
  };
  const Icon = config.icon;

  return (
    <Badge tone={config.tone} className={className}>
      <Icon />
      {config.label}
    </Badge>
  );
}
