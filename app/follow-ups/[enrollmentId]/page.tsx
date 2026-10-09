"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { FollowUpExecutionTimeline } from "@/components/follow-ups/FollowUpExecutionTimeline";

/**
 * /follow-ups/[enrollmentId] — "Execution History" tab for one enrollment.
 * Meant to be embedded as a tab in a Lead / Enrollment detail page.
 */
export default function FollowUpEnrollmentHistoryPage() {
  const params = useParams<{ enrollmentId: string }>();
  const enrollmentId = params.enrollmentId;

  return (
    <div className="space-y-4">
      <Link
        href="/follow-ups"
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-[#173b2b]"
      >
        <ChevronLeft className="size-4" />
        Tất cả follow-up
      </Link>

      <FollowUpExecutionTimeline
        enrollmentId={enrollmentId}
        title="Execution History"
      />
    </div>
  );
}