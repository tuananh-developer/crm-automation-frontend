"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, AlertTriangle, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cancelEnrollment } from "@/services/follow-up.service";
import type { LeadFollowUpEnrollment } from "@/types/follow-up";

interface CancelEnrollmentDialogProps {
  enrollment: LeadFollowUpEnrollment;
  isOpen: boolean;
  onClose: () => void;
  onCancelled?: () => void;
}

const CANCELLATION_PRESETS = [
  "Customer requested stop",
  "Lead converted / Meeting booked",
  "Lead unresponsive / Lost",
  "Wrong cadence sequence assigned",
  "Custom reason...",
];

export function CancelEnrollmentDialog({
  enrollment,
  isOpen,
  onClose,
  onCancelled,
}: CancelEnrollmentDialogProps) {
  const queryClient = useQueryClient();
  const [selectedReason, setSelectedReason] = React.useState(CANCELLATION_PRESETS[0]);
  const [customReason, setCustomReason] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const finalReason =
    selectedReason === "Custom reason..."
      ? customReason.trim() || "Cancelled by user"
      : selectedReason;

  const cancelMutation = useMutation({
    mutationFn: async () => {
      return cancelEnrollment(enrollment.id, {
        cancellationReason: finalReason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["follow-up-executions"] });
      onCancelled?.();
      onClose();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to cancel enrollment";
      setErrorMessage(msg);
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-gray-200 space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-rose-100 text-rose-800">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Cancel Active Follow-Up
              </h3>
              <p className="text-xs text-gray-500">
                Halt cadence executions for this lead
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="size-8 p-0 text-gray-400 hover:text-gray-700"
          >
            <X className="size-4" />
          </Button>
        </div>

        {errorMessage && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-800 flex items-center gap-2">
            <X className="size-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-3.5 text-xs text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-amber-950">
              <Ban className="size-4 text-amber-600" />
              What happens when you cancel?
            </p>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Active sequence &ldquo;{enrollment.sequence?.name || "Cadence"}&rdquo; will be marked as <strong>CANCELLED</strong>. All pending scheduled dispatches will be automatically skipped.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">Cancellation Reason</Label>
            <Select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="text-xs font-medium"
            >
              {CANCELLATION_PRESETS.map((preset) => (
                <option key={preset} value={preset}>
                  {preset}
                </option>
              ))}
            </Select>
          </div>

          {selectedReason === "Custom reason..." && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">Custom Reason Details</Label>
              <Textarea
                rows={2}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Explain why this cadence is being stopped..."
                className="text-xs"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Keep Running
          </Button>
          <Button
            size="sm"
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
          >
            {cancelMutation.isPending ? "Cancelling..." : "Confirm Cancellation"}
          </Button>
        </div>
      </div>
    </div>
  );
}
