"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  Bot,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Cpu,
  HelpCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { leadService } from "@/services/lead.service";
import type { Lead, QualificationStatus } from "@/types/lead";

export interface AiQualificationCardProps {
  lead: Lead;
  onRefresh?: () => void;
}

function getStatusBadge(status?: QualificationStatus) {
  switch (status) {
    case "QUALIFIED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 shadow-2xs">
          <CheckCircle2 className="size-3.5 text-emerald-600" />
          AI Qualified
        </span>
      );
    case "UNQUALIFIED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 border border-rose-200 shadow-2xs">
          <XCircle className="size-3.5 text-rose-600" />
          Unqualified
        </span>
      );
    case "NEEDS_REVIEW":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200 shadow-2xs">
          <AlertTriangle className="size-3.5 text-amber-600" />
          Needs Human Review
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500 border border-gray-200">
          <HelpCircle className="size-3.5" />
          Not Evaluated
        </span>
      );
  }
}

export function AiQualificationCard({
  lead,
  onRefresh,
}: AiQualificationCardProps) {
  const queryClient = useQueryClient();
  const [showHistory, setShowHistory] = React.useState(false);

  // Fetch latest qualification
  const {
    data: qualification,
    isLoading: isQualLoading,
  } = useQuery({
    queryKey: ["lead-qualification", lead.id],
    queryFn: () => leadService.getLatestQualification(lead.id),
  });

  // Fetch qualification history
  const { data: history = [] } = useQuery({
    queryKey: ["lead-qualification-history", lead.id],
    queryFn: () => leadService.getQualificationHistory(lead.id),
    enabled: showHistory,
  });

  // Trigger qualification mutation
  const triggerMutation = useMutation({
    mutationFn: () => leadService.triggerQualification(lead.id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["lead-qualification", lead.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["lead", lead.id],
      });
      if (onRefresh) onRefresh();
    },
  });

  const confidencePercentage =
    qualification?.confidence !== null && qualification?.confidence !== undefined
      ? Math.round(Number(qualification.confidence) * 100)
      : null;

  return (
    <Card className="border border-emerald-100/90 bg-white shadow-xs overflow-hidden">
      {/* Header */}
      <CardHeader className="border-b border-[#edf0ee] bg-gradient-to-r from-emerald-50/40 via-teal-50/20 to-white px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-xs">
              <Bot className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold text-gray-900">
                  AI Lead Qualification
                </CardTitle>
                <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  Active ML Engine
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                Automated intent assessment, conversion probability &amp; routing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => triggerMutation.mutate()}
              disabled={triggerMutation.isPending || isQualLoading}
              className="h-8 gap-1.5 text-xs font-semibold text-emerald-800 border-emerald-300 hover:bg-emerald-50"
            >
              {triggerMutation.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Assessing...
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5 text-emerald-600" />
                  Run AI Assessment
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        {isQualLoading ? (
          <div className="py-8 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
            <Loader2 className="size-4 animate-spin text-emerald-600" />
            Evaluating qualification state...
          </div>
        ) : !qualification ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 p-6 text-center space-y-3">
            <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
              <Bot className="size-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-gray-800">
                No Qualification Run Recorded Yet
              </h4>
              <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                Trigger the AI Qualification engine to analyze company firmographics,
                lead title, and intent signals to determine if this lead meets the sales-ready threshold.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => triggerMutation.mutate()}
              disabled={triggerMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              <Sparkles className="size-3.5 mr-1" />
              Evaluate Lead Now
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status & Confidence Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Box 1: Status & Intent */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Decision Outcome
                </span>
                <div className="flex items-center gap-2">
                  {getStatusBadge(qualification.status)}
                </div>
                {qualification.intent && (
                  <div className="pt-1 text-xs">
                    <span className="text-gray-500">Detected Intent: </span>
                    <span className="font-semibold text-gray-800">
                      {qualification.intent}
                    </span>
                  </div>
                )}
              </div>

              {/* Box 2: Confidence Bar */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Confidence Level
                  </span>
                  <span className="font-bold text-gray-900">
                    {confidencePercentage !== null ? `${confidencePercentage}%` : "N/A"}
                  </span>
                </div>
                {confidencePercentage !== null && (
                  <div className="space-y-1">
                    <div className="h-2.5 w-full rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          confidencePercentage >= 80
                            ? "bg-emerald-500"
                            : confidencePercentage >= 60
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                        style={{ width: `${confidencePercentage}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500 block text-right">
                      Threshold for Auto-Qualify: ≥ 80%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* AI Reasoning Text */}
            {qualification.reason && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/20 p-4 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <Sparkles className="size-3.5 text-emerald-600" />
                  <span>Explainable AI Qualification Reasoning</span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed italic">
                  &ldquo;{qualification.reason}&rdquo;
                </p>
              </div>
            )}

            {/* Model & Runtime Metadata */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3 text-[11px] text-gray-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Cpu className="size-3 text-gray-400" />
                  Provider:{" "}
                  <strong className="text-gray-700">
                    {qualification.modelProvider || "Google Gemini"}
                  </strong>
                </span>
                {qualification.modelVersion && (
                  <span>
                    Version:{" "}
                    <strong className="text-gray-700">
                      {qualification.modelVersion}
                    </strong>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-gray-400">
                  <Clock className="size-3" />
                  {new Date(qualification.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>

                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className="font-semibold text-emerald-700 hover:text-emerald-800 text-xs flex items-center gap-0.5"
                >
                  {showHistory ? "Hide History" : "View History"}
                  <ArrowRight className="size-3" />
                </button>
              </div>
            </div>

            {/* History Accordion */}
            {showHistory && (
              <div className="border-t border-gray-100 pt-3 space-y-2 animate-in fade-in duration-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Past Qualification Assessments ({history.length})
                </span>
                {history.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No previous runs.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {history.map((h) => (
                      <div
                        key={h.id}
                        className="rounded-lg border border-gray-100 bg-gray-50/50 p-2.5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          {getStatusBadge(h.status)}
                          <span className="text-gray-600 font-medium truncate max-w-xs">
                            {h.reason || h.intent || "Routine qualification"}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {new Date(h.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
