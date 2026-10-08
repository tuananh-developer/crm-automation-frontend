"use client";

import * as React from "react";
import { X, Play, Clock, Sparkles, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChannelBadge } from "./ChannelBadge";
import { formatDelayDescription } from "@/lib/delay-utils";
import type { FollowUpStep, FollowUpSequence } from "@/types/follow-up";

interface CadenceSimulatorModalProps {
  sequence: Partial<FollowUpSequence>;
  steps: FollowUpStep[];
  isOpen: boolean;
  onClose: () => void;
}

interface SimulatedTimelineEntry {
  step: FollowUpStep;
  cumulativeMinutes: number;
  scheduledDate: Date;
}

function computeSimulatedTimeline(steps: FollowUpStep[]): SimulatedTimelineEntry[] {
  const sortedSteps = [...steps]
    .filter((s) => s.isActive !== false)
    .sort((a, b) => a.stepOrder - b.stepOrder);

  const now = new Date();
  const entries: SimulatedTimelineEntry[] = [];
  let runningMinutes = 0;

  for (const step of sortedSteps) {
    runningMinutes += step.delayMinutes;
    const scheduledDate = new Date(now.getTime() + runningMinutes * 60 * 1000);
    entries.push({
      step,
      cumulativeMinutes: runningMinutes,
      scheduledDate,
    });
  }

  return entries;
}

export function CadenceSimulatorModal({
  sequence,
  steps,
  isOpen,
  onClose,
}: CadenceSimulatorModalProps) {
  const simulatedTimeline = React.useMemo(
    () => computeSimulatedTimeline(steps),
    [steps],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl border border-gray-200 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Cadence Execution Simulator
              </h3>
              <p className="text-xs text-gray-500">
                Simulated execution plan for &ldquo;{sequence.name || "Untitled Sequence"}&rdquo;
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

        {/* Lead profile mock */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              JD
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-950">John Doe (VP of Operations)</p>
              <p className="text-[11px] text-emerald-700">Acme Corporation · john.doe@acme.corp</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
              Enrollment Event
            </span>
            <span className="text-xs font-semibold text-gray-700">T = 0 (Immediate)</span>
          </div>
        </div>

        {/* Simulated Timeline Steps */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Chronological Dispatch Schedule ({simulatedTimeline.length} Steps)
          </h4>

          {simulatedTimeline.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No active steps found in this sequence.</p>
          ) : (
            <div className="relative border-l-2 border-emerald-500 ml-4 pl-6 space-y-6">
              {/* Trigger Node */}
              <div className="relative">
                <span className="absolute -left-[31px] top-0 flex size-4 rounded-full bg-emerald-600 ring-4 ring-white" />
                <div className="text-xs">
                  <p className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Play className="size-3 text-emerald-600 fill-emerald-600" />
                    Lead Enrolls in Cadence
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Timestamp: Immediate (T+0)
                  </p>
                </div>
              </div>

              {/* Steps */}
              {simulatedTimeline.map(({ step, cumulativeMinutes, scheduledDate }) => (
                <div key={step.id || step.stepOrder} className="relative">
                  <span className="absolute -left-[31px] top-1 flex size-4 rounded-full bg-emerald-500 ring-4 ring-white" />
                  <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex size-5 items-center justify-center rounded-md bg-gray-900 text-white font-bold text-[10px]">
                          #{step.stepOrder}
                        </span>
                        <ChannelBadge channel={step.channel} size="sm" />
                        <span className="text-xs font-bold text-gray-800">
                          {step.actionType}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Clock className="size-3" />
                        <span>
                          {cumulativeMinutes === 0
                            ? "Instantly"
                            : `+${cumulativeMinutes >= 1440 ? `${(cumulativeMinutes / 1440).toFixed(1)} days` : `${(cumulativeMinutes / 60).toFixed(1)} hours`}`}
                        </span>
                      </div>
                    </div>

                    {step.subjectTemplate && (
                      <p className="text-xs font-semibold text-gray-700 truncate">
                        Subject: {step.subjectTemplate}
                      </p>
                    )}

                    <p className="text-[11px] text-gray-500 line-clamp-2 italic">
                      &ldquo;{step.contentTemplate}&rdquo;
                    </p>

                    <p className="text-[10px] text-gray-400">
                      Estimated Delivery: {scheduledDate.toLocaleDateString()} at{" "}
                      {scheduledDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} (
                      {formatDelayDescription(step.delayMinutes, step.stepOrder)})
                    </p>
                  </div>
                </div>
              ))}

              {/* Completed Node */}
              <div className="relative">
                <span className="absolute -left-[31px] top-0 flex size-4 rounded-full bg-blue-600 ring-4 ring-white" />
                <div className="text-xs">
                  <p className="font-bold text-gray-900 flex items-center gap-1.5">
                    <CheckCircle className="size-3 text-blue-600" />
                    Sequence Completed
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Lead transitions to Completed status; next lifecycle stage triggered.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-gray-100">
          <Button onClick={onClose} className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs">
            Close Simulator
          </Button>
        </div>
      </div>
    </div>
  );
}
