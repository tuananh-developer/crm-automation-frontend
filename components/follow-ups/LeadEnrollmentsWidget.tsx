"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  PlayCircle,
  Plus,
  ArrowRight,
  ExternalLink,
  Ban,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnrollmentStatusBadge } from "./EnrollmentStatusBadge";
import { ChannelBadge } from "./ChannelBadge";
import { CancelEnrollmentDialog } from "./CancelEnrollmentDialog";
import { EnrollInSequenceModal } from "./EnrollInSequenceModal";
import { getEnrollmentsByLead } from "@/services/follow-up.service";
import { formatDelayDescription } from "@/lib/delay-utils";
import type { LeadFollowUpEnrollment } from "@/types/follow-up";
import type { Lead } from "@/types/lead";

interface LeadEnrollmentsWidgetProps {
  lead: Lead;
}

export function LeadEnrollmentsWidget({ lead }: LeadEnrollmentsWidgetProps) {
  const [isEnrollModalOpen, setIsEnrollModalOpen] = React.useState(false);
  const [enrollmentToCancel, setEnrollmentToCancel] =
    React.useState<LeadFollowUpEnrollment | null>(null);
  const [showHistory, setShowHistory] = React.useState(false);

  // Fetch enrollments for this lead
  const {
    data: enrollments = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["lead-enrollments", lead.id],
    queryFn: () => getEnrollmentsByLead(lead.id),
    enabled: Boolean(lead?.id),
  });

  const activeEnrollment = React.useMemo(() => {
    return enrollments.find((e) => e.status === "ACTIVE") || null;
  }, [enrollments]);

  const pastEnrollments = React.useMemo(() => {
    return enrollments.filter((e) => e.status !== "ACTIVE");
  }, [enrollments]);

  if (isLoading) {
    return (
      <Card className="border-[#e2e8e4] bg-white shadow-xs">
        <CardContent className="p-6 flex items-center justify-center gap-2 text-xs text-gray-500">
          <span className="size-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <span>Loading cadence enrollments...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[#e2e8e4] bg-white shadow-xs overflow-hidden">
      {/* Header */}
      <CardHeader className="border-b border-[#edf0ee] px-6 py-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
            <Clock className="size-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-gray-900">
              Follow-Up Cadences &amp; Sequences
            </CardTitle>
            <p className="text-[11px] text-gray-500">
              UC05 Multi-Touch Automated Outreach
            </p>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => setIsEnrollModalOpen(true)}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs h-8 shadow-2xs gap-1"
        >
          <Plus className="size-3.5" />
          Enroll in Sequence
        </Button>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        {/* Case 1: Active Enrollment Card */}
        {activeEnrollment ? (
          <div className="rounded-2xl border-2 border-emerald-500/60 bg-gradient-to-br from-emerald-50/50 via-white to-white p-5 shadow-xs space-y-4">
            {/* Top row: Title, status, actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    Current Active Journey
                  </span>
                  <EnrollmentStatusBadge status={activeEnrollment.status} />
                </div>
                <h4 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                  <Link
                    href={`/follow-ups/sequences/${activeEnrollment.sequenceId}`}
                    className="hover:text-emerald-800 hover:underline flex items-center gap-1"
                  >
                    {activeEnrollment.sequence?.name || "Outreach Cadence"}
                    <ExternalLink className="size-3 text-gray-400" />
                  </Link>
                </h4>
              </div>

              {/* Action Buttons: Cancel and Logs */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEnrollmentToCancel(activeEnrollment)}
                  className="h-8 text-xs text-rose-700 border-rose-200 hover:bg-rose-50 font-semibold"
                >
                  <Ban className="size-3 mr-1" />
                  Cancel Sequence
                </Button>

                <Button
                  asChild
                  size="sm"
                  className="h-8 text-xs bg-[#17221c] hover:bg-[#253930] text-white font-semibold shadow-xs"
                >
                  <Link href={`/follow-ups/${activeEnrollment.id}`}>
                    <Clock className="size-3 mr-1" />
                    Execution History
                    <ArrowRight className="size-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Current Step Section */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 bg-white p-3.5 rounded-xl border border-emerald-100/80 shadow-2xs">
              {/* Current Step indicator */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Current Step Target
                </span>
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-md bg-emerald-800 text-white font-bold text-xs">
                    #{activeEnrollment.currentStep?.stepOrder || 1}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {activeEnrollment.currentStep?.actionType || "SEND_EMAIL"}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {activeEnrollment.currentStep
                        ? formatDelayDescription(
                            activeEnrollment.currentStep.delayMinutes,
                            activeEnrollment.currentStep.stepOrder,
                          )
                        : "Immediate"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Channel */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Channel
                </span>
                <div>
                  <ChannelBadge
                    channel={activeEnrollment.currentStep?.channel || "EMAIL"}
                  />
                </div>
              </div>

              {/* Started At */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Enrolled On
                </span>
                <p className="text-xs font-semibold text-gray-700">
                  {activeEnrollment.startedAt
                    ? new Date(activeEnrollment.startedAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Recently"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Case 2: No Active Enrollment */
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 p-6 text-center space-y-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500 mx-auto">
              <PlayCircle className="size-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-gray-800">
                No Active Cadence Running
              </h4>
              <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                Enroll this lead into a personalized multi-touch follow-up cadence (Email, SMS, Task) to accelerate sales qualification.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => setIsEnrollModalOpen(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold h-8"
            >
              <Plus className="size-3 mr-1" />
              Enroll in Cadence Now
            </Button>
          </div>
        )}

        {/* Past Enrollments History */}
        {pastEnrollments.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center justify-between w-full text-xs font-bold text-gray-600 hover:text-gray-900"
            >
              <span className="flex items-center gap-1.5">
                <History className="size-3.5 text-gray-400" />
                Previous Enrollments History ({pastEnrollments.length})
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold">
                {showHistory ? "Hide History" : "Show History"}
              </span>
            </button>

            {showHistory && (
              <div className="space-y-2">
                {pastEnrollments.map((enr) => (
                  <div
                    key={enr.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50/40 p-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">
                          {enr.sequence?.name || "Follow-up Sequence"}
                        </span>
                        <EnrollmentStatusBadge status={enr.status} />
                      </div>
                      <p className="text-[11px] text-gray-500">
                        Enrolled: {enr.startedAt ? new Date(enr.startedAt).toLocaleDateString() : "N/A"}
                        {enr.cancelledAt && (
                          <span>
                            {" "}&bull; Cancelled: {new Date(enr.cancelledAt).toLocaleDateString()}
                            {enr.cancellationReason && ` (${enr.cancellationReason})`}
                          </span>
                        )}
                        {enr.completedAt && (
                          <span>
                            {" "}&bull; Completed: {new Date(enr.completedAt).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>

                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="text-xs text-gray-600 hover:text-gray-900 h-7"
                    >
                      <Link href={`/follow-ups/${enr.id}`}>
                        Logs <ArrowRight className="size-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Enroll Modal */}
      <EnrollInSequenceModal
        lead={lead}
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        onSuccess={() => refetch()}
      />

      {/* Cancel Confirmation Dialog */}
      {enrollmentToCancel && (
        <CancelEnrollmentDialog
          enrollment={enrollmentToCancel}
          isOpen={Boolean(enrollmentToCancel)}
          onClose={() => setEnrollmentToCancel(null)}
          onCancelled={() => refetch()}
        />
      )}
    </Card>
  );
}
