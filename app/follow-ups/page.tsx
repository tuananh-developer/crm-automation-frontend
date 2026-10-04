"use client";

import { FollowUpExecutionTimeline } from "@/components/follow-ups/FollowUpExecutionTimeline";

/**
 * /follow-ups — Execution History timeline for every enrollment.
 * Linked from a Lead/Enrollment detail page via /follow-ups/[enrollmentId].
 */
export default function FollowUpsPage() {
  return <FollowUpExecutionTimeline />;
}