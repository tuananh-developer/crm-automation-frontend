"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, UserPlus, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { enrollLead } from "@/services/follow-up.service";
import { leadService } from "@/services/lead.service";
import type { Lead } from "@/types/lead";
import type { FollowUpSequence } from "@/types/follow-up";
import Link from "next/link";

interface EnrollLeadDialogProps {
  sequence: FollowUpSequence;
  isOpen: boolean;
  onClose: () => void;
}

export function EnrollLeadDialog({
  sequence,
  isOpen,
  onClose,
}: EnrollLeadDialogProps) {
  const queryClient = useQueryClient();
  const [selectedLeadId, setSelectedLeadId] = React.useState<string>("");
  const [customLeadId, setCustomLeadId] = React.useState<string>("");
  const [resultMessage, setResultMessage] = React.useState<{
    type: "success" | "error";
    text: string;
    enrollmentId?: string;
  } | null>(null);

  // Fetch available leads to pick from
  const { data: leadsData } = useQuery({
    queryKey: ["leads-for-enrollment"],
    queryFn: () => leadService.getLeads(),
    enabled: isOpen,
  });

  const leads: Lead[] = React.useMemo(() => leadsData?.data || [], [leadsData]);

  // Derive active leadId
  const effectiveLeadId =
    selectedLeadId || (leads.length > 0 ? leads[0].id : "");

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const targetLeadId =
        effectiveLeadId === "custom" ? customLeadId.trim() : effectiveLeadId;
      if (!targetLeadId) throw new Error("Please select or enter a valid Lead ID");
      return enrollLead({
        leadId: targetLeadId,
        sequenceId: sequence.id,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      setResultMessage({
        type: "success",
        text: `Lead enrolled successfully into "${sequence.name}"!`,
        enrollmentId: data.id,
      });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to enroll lead";
      setResultMessage({
        type: "error",
        text: msg,
      });
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-gray-200 space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <UserPlus className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Enroll Lead in Sequence</h3>
              <p className="text-xs text-gray-500 truncate max-w-[260px]">{sequence.name}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="size-7 p-0 text-gray-400 hover:text-gray-700"
          >
            <X className="size-4" />
          </Button>
        </div>

        {resultMessage ? (
          <div className="space-y-4 py-2">
            <div
              className={`rounded-xl p-4 text-xs font-semibold ${
                resultMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {resultMessage.type === "success" ? (
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="size-4 text-rose-600 shrink-0" />
                )}
                <span>{resultMessage.text}</span>
              </div>
            </div>

            {resultMessage.enrollmentId && (
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs">
                <span className="text-gray-600">Track execution logs:</span>
                <Button asChild size="sm" variant="outline" className="text-xs h-7">
                  <Link href={`/follow-ups/${resultMessage.enrollmentId}`}>
                    <Clock className="size-3 mr-1" /> View Timeline
                  </Link>
                </Button>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setResultMessage(null);
                  onClose();
                }}
                className="text-xs"
              >
                Close
              </Button>
              {resultMessage.type === "error" && (
                <Button
                  size="sm"
                  onClick={() => enrollMutation.mutate()}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs"
                >
                  Try Again
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">Select Inbound Lead</Label>
              <Select
                value={effectiveLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="text-xs font-medium"
              >
                {leads.map((l: Lead) => (
                  <option key={l.id} value={l.id}>
                    {l.firstName} {l.lastName} &bull; {l.companyName || l.email} ({l.status})
                  </option>
                ))}
                <option value="custom">-- Enter Custom Lead UUID --</option>
              </Select>
            </div>

            {effectiveLeadId === "custom" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700">Lead UUID</Label>
                <Input
                  value={customLeadId}
                  onChange={(e) => setCustomLeadId(e.target.value)}
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                  className="text-xs font-mono"
                />
              </div>
            )}

            <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-[11px] text-gray-600 space-y-1">
              <p className="font-semibold text-gray-800">Enrollment Action:</p>
              <p>
                Enrolling this lead initiates Step #1 of &ldquo;{sequence.name}&rdquo;. Step 1 execution will be scheduled according to the configured delay.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => enrollMutation.mutate()}
                disabled={enrollMutation.isPending}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
              >
                {enrollMutation.isPending ? "Enrolling..." : "Enroll Lead Now"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
