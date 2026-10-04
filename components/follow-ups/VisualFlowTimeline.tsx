"use client";

import * as React from "react";
import { Clock, PlayCircle, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChannelBadge } from "./ChannelBadge";
import { formatDelayDescription } from "@/lib/delay-utils";
import type { FollowUpStep } from "@/types/follow-up";

interface VisualFlowTimelineProps {
  steps: FollowUpStep[];
  selectedStepId?: string;
  onSelectStep?: (stepId: string) => void;
  className?: string;
}

export function VisualFlowTimeline({
  steps,
  selectedStepId,
  onSelectStep,
  className,
}: VisualFlowTimelineProps) {
  const sortedSteps = React.useMemo(() => {
    return [...steps].sort((a, b) => a.stepOrder - b.stepOrder);
  }, [steps]);

  if (sortedSteps.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center text-xs text-gray-500">
        No steps added yet. Add your first step below to see the cadence flow visualization.
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border border-[#e2e8e4] bg-white p-5 shadow-xs overflow-x-auto", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="flex size-2 rounded-full bg-emerald-500"></span>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Cadence Flow Map ({sortedSteps.length} Steps)
          </h4>
        </div>
        <p className="text-xs text-gray-400">
          Click any step node to jump directly to its settings
        </p>
      </div>

      <div className="flex items-center gap-2 min-w-max pb-2">
        {/* Start Trigger Node */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-emerald-800 shadow-2xs">
            <PlayCircle className="size-4 text-emerald-600" />
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                Trigger
              </p>
              <p className="text-xs font-bold">Lead Enrolled</p>
            </div>
          </div>
        </div>

        {/* Steps loop */}
        {sortedSteps.map((step, idx) => {
          const isSelected = selectedStepId === step.id;
          const isInactive = step.isActive === false;

          return (
            <React.Fragment key={step.id || `step-${idx}`}>
              {/* Connector with Delay */}
              <div className="flex flex-col items-center px-1">
                <div className="flex items-center gap-1 rounded-full bg-gray-100 border border-gray-200 px-2 py-0.5 text-[10px] text-gray-600 font-medium">
                  <Clock className="size-2.5" />
                  <span>
                    {step.delayMinutes === 0
                      ? "Immediate"
                      : `+${step.delayMinutes >= 1440 ? `${Math.round(step.delayMinutes / 1440)}d` : `${Math.round(step.delayMinutes / 60)}h`}`}
                  </span>
                </div>
                <div className="w-8 border-t-2 border-dashed border-gray-300 my-1"></div>
              </div>

              {/* Step Card Node */}
              <button
                type="button"
                onClick={() => onSelectStep?.(step.id)}
                className={cn(
                  "group flex flex-col items-start rounded-xl border p-3 text-left transition-all max-w-[200px] min-w-[160px] shadow-2xs hover:shadow-xs",
                  isSelected
                    ? "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                    : isInactive
                      ? "border-gray-200 bg-gray-50/60 opacity-60"
                      : "border-gray-200 bg-white hover:border-gray-300",
                )}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className="flex size-5 items-center justify-center rounded-md bg-gray-900 text-white font-bold text-[10px]">
                    #{step.stepOrder}
                  </span>
                  <ChannelBadge channel={step.channel} size="sm" showLabel={false} />
                </div>

                <p className="text-xs font-bold text-gray-900 truncate w-full">
                  {step.subjectTemplate || step.actionType || `Step ${step.stepOrder}`}
                </p>

                <p className="text-[10px] text-gray-400 mt-0.5 truncate w-full">
                  {formatDelayDescription(step.delayMinutes, step.stepOrder)}
                </p>

                {isInactive && (
                  <span className="mt-1 text-[9px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                    Paused
                  </span>
                )}
              </button>
            </React.Fragment>
          );
        })}

        {/* End Node */}
        <div className="flex flex-col items-center px-1">
          <div className="w-6 border-t-2 border-dashed border-gray-300 my-1"></div>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 border border-slate-200 px-3 py-2 text-slate-700 shadow-2xs">
          <Flag className="size-4 text-slate-500" />
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Goal
            </p>
            <p className="text-xs font-bold">Cadence Complete</p>
          </div>
        </div>
      </div>
    </div>
  );
}
