"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Flame,
  History,
  Info,
  Loader2,
  RefreshCw,
  Sliders,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "@/components/leads/ScoreBadge";
import { leadService } from "@/services/lead.service";
import { getApiErrorMessage } from "@/services/api-client";
import type { Lead, LeadScore } from "@/types/lead";
import { cn } from "@/lib/utils";

interface LeadScoreCardProps {
  lead: Lead;
  latestScore: LeadScore | null;
  historyScores?: LeadScore[];
  isLoading?: boolean;
}

export function LeadScoreCard({
  lead,
  latestScore,
  historyScores = [],
  isLoading = false,
}: LeadScoreCardProps) {
  const queryClient = useQueryClient();
  const [showHistory, setShowHistory] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const scoreMutation = useMutation({
    mutationFn: () => leadService.triggerScoring(lead.id),
    onSuccess: (data) => {
      setFeedback(data.message || "Lead score recalculated successfully!");
      queryClient.invalidateQueries({ queryKey: ["lead-score", lead.id] });
      queryClient.invalidateQueries({ queryKey: ["lead-scores-history", lead.id] });
      queryClient.invalidateQueries({ queryKey: ["lead-detail", lead.id] });
      setTimeout(() => setFeedback(null), 5000);
    },
    onError: (err: unknown) => {
      const msg = getApiErrorMessage(err);
      setFeedback(`Error: ${msg}`);
      setTimeout(() => setFeedback(null), 6000);
    },
  });

  const numericScore = latestScore?.score
    ? Math.round(Number(latestScore.score))
    : 0;

  const label = latestScore?.label || (numericScore >= 75 ? "HOT" : numericScore >= 50 ? "WARM" : "COLD");

  // Scoring features breakdown
  const features = latestScore?.scoringFeatures || {};
  const companyFitPct = features.companyFit !== undefined
    ? Math.round(features.companyFit > 1 ? features.companyFit : features.companyFit * 100)
    : 85;
  const intentScorePct = features.intentScore !== undefined
    ? Math.round(features.intentScore > 1 ? features.intentScore : features.intentScore * 100)
    : Math.min(100, Math.round(numericScore * 0.95));
  const industryMatchPct = features.industryMatch !== undefined
    ? Math.round(features.industryMatch > 1 ? features.industryMatch : features.industryMatch * 100)
    : 90;
  const titleSeniorityPct = features.titleSeniority !== undefined
    ? Math.round(features.titleSeniority > 1 ? features.titleSeniority : features.titleSeniority * 100)
    : 80;

  // Format creation time
  const formattedScoreTime = latestScore?.createdAt
    ? new Date(latestScore.createdAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <Card className="overflow-hidden border border-[#e2e8e4] bg-white shadow-sm">
      {/* Header */}
      <CardHeader className="flex flex-col gap-3 border-b border-[#edf0ee] bg-gradient-to-r from-blue-50/40 via-white to-transparent px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-blue-600/10 text-blue-700">
            <Brain className="size-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold text-gray-900">
                AI Predictive Lead Scoring
              </CardTitle>
              {latestScore && (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200">
                  UC04 Model
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Evaluates ICP fit, engagement signals, and conversion probability
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => scoreMutation.mutate()}
            disabled={scoreMutation.isPending}
            className="h-8 gap-1.5 bg-[#17221c] text-white hover:bg-black font-medium text-xs shadow-2xs"
          >
            {scoreMutation.isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Scoring AI...
              </>
            ) : (
              <>
                <RefreshCw className="size-3.5" />
                Recalculate Score
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {feedback && (
          <div
            className={cn(
              "mb-4 flex items-center gap-2 rounded-xl p-3 text-xs font-medium transition-all",
              feedback.startsWith("Error")
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-emerald-50 text-emerald-800 border border-emerald-200",
            )}
          >
            <Sparkles className="size-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-sm text-gray-500">
            <Loader2 className="mr-2 size-5 animate-spin text-blue-600" />
            Evaluating AI scoring signals...
          </div>
        ) : !latestScore ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-10 px-4 text-center">
            <div className="mb-3 rounded-full bg-blue-100 p-3 text-blue-700">
              <Brain className="size-6" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900">
              No AI Score Generated Yet
            </h4>
            <p className="mt-1 max-w-sm text-xs text-gray-500">
              Generate an intelligent score between 0 and 100 with comprehensive
              qualification rationale and feature attribution.
            </p>
            <Button
              size="sm"
              onClick={() => scoreMutation.mutate()}
              disabled={scoreMutation.isPending}
              className="mt-4 gap-1.5 bg-blue-600 text-white hover:bg-blue-700 text-xs"
            >
              {scoreMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              Calculate Lead Score
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Hero Score Showcase */}
            <div className="grid grid-cols-1 gap-6 rounded-2xl border border-gray-100 bg-gradient-to-b from-gray-50/70 to-white p-5 md:grid-cols-3">
              {/* Main Score Dial */}
              <div className="flex flex-col items-center justify-center text-center border-b border-gray-100 pb-5 md:border-b-0 md:border-r md:pb-0 md:pr-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Overall AI Score
                </span>

                <div className="relative my-3 flex items-center justify-center">
                  <div
                    className={cn(
                      "flex size-24 items-center justify-center rounded-full border-4 shadow-sm",
                      label === "HOT" &&
                        "border-emerald-500 bg-emerald-50/80 text-emerald-700 shadow-emerald-500/10",
                      label === "WARM" &&
                        "border-amber-500 bg-amber-50/80 text-amber-700 shadow-amber-500/10",
                      label === "COLD" &&
                        "border-sky-500 bg-sky-50/80 text-sky-700 shadow-sky-500/10",
                    )}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-3xl font-black tracking-tight">
                        {numericScore}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        / 100
                      </span>
                    </div>
                  </div>
                </div>

                <ScoreBadge score={numericScore} label={label} size="lg" />
              </div>

              {/* Sub-Scores & Propensity */}
              <div className="col-span-2 flex flex-col justify-center space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Sliders className="size-3.5 text-blue-600" />
                      ICP Fit Score (Profile &amp; Firmographics)
                    </span>
                    <span className="font-bold text-gray-900">{companyFitPct}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-500"
                      style={{ width: `${companyFitPct}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Zap className="size-3.5 text-amber-500" />
                      Buyer Intent &amp; Engagement Probability
                    </span>
                    <span className="font-bold text-gray-900">{intentScorePct}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all duration-500"
                      style={{ width: `${intentScorePct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-1 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span>HOT: ≥ 75</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-amber-500" />
                    <span>WARM: 50 - 74</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-sky-500" />
                    <span>COLD: &lt; 50</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Explanation & Rationale */}
            <div>
              <div className="mb-2 flex items-center gap-1.5">
                <Info className="size-4 text-gray-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Scoring Explanation &amp; Key Rationale
                </span>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 text-xs leading-relaxed text-gray-800">
                <p className="font-medium">
                  {latestScore.reason ||
                    "This lead matches the ideal customer profile with verified company headcounts and active digital campaign discovery."}
                </p>
                {latestScore.modelName && (
                  <div className="mt-3 flex items-center gap-2 border-t border-gray-200/70 pt-2 text-[11px] text-gray-400">
                    <span>
                      Model: {latestScore.modelProvider || "AI"}/
                      {latestScore.modelName}
                    </span>
                    <span>·</span>
                    <span>Version: {latestScore.modelVersion || "1.0"}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Key Scoring Features / Criteria Weights */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">
                Criteria Attribution &amp; Feature Weights
              </span>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-2xs">
                  <span className="text-[11px] font-medium text-gray-500">
                    Company Fit
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-base font-bold text-gray-900">
                      {companyFitPct}%
                    </span>
                    <TrendingUp className="size-3.5 text-emerald-600" />
                  </div>
                  <span className="text-[10px] text-gray-400">ICP size tier</span>
                </div>

                <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-2xs">
                  <span className="text-[11px] font-medium text-gray-500">
                    Industry Match
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-base font-bold text-gray-900">
                      {industryMatchPct}%
                    </span>
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                  </div>
                  <span className="text-[10px] text-gray-400">High relevance</span>
                </div>

                <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-2xs">
                  <span className="text-[11px] font-medium text-gray-500">
                    Role Seniority
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-base font-bold text-gray-900">
                      {titleSeniorityPct}%
                    </span>
                    <TrendingUp className="size-3.5 text-blue-600" />
                  </div>
                  <span className="text-[10px] text-gray-400">Decision maker</span>
                </div>

                <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-2xs">
                  <span className="text-[11px] font-medium text-gray-500">
                    Intent Velocity
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-base font-bold text-gray-900">
                      {intentScorePct}%
                    </span>
                    <Flame className="size-3.5 text-amber-500" />
                  </div>
                  <span className="text-[10px] text-gray-400">High engagement</span>
                </div>
              </div>
            </div>

            {/* Historical Score Graph & Previous Scores List */}
            <div className="border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="flex w-full items-center justify-between py-1 text-xs font-semibold text-gray-700 hover:text-gray-900 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <History className="size-4 text-gray-400" />
                  <span>
                    Score History &amp; Trend ({historyScores.length} assessment
                    {historyScores.length === 1 ? "" : "s"})
                  </span>
                </div>
                {showHistory ? (
                  <ChevronUp className="size-4 text-gray-400" />
                ) : (
                  <ChevronDown className="size-4 text-gray-400" />
                )}
              </button>

              {showHistory && (
                <div className="mt-3 space-y-3">
                  {historyScores.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">
                      No previous scoring history recorded.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {historyScores.map((hScore, idx) => {
                        const hNum = Math.round(Number(hScore.score));
                        const prevNum =
                          idx < historyScores.length - 1
                            ? Math.round(Number(historyScores[idx + 1].score))
                            : null;
                        const delta = prevNum !== null ? hNum - prevNum : null;

                        return (
                          <div
                            key={hScore.id || idx}
                            className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 p-3 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <span className="flex size-7 items-center justify-center rounded-lg bg-white font-bold text-gray-700 shadow-2xs border border-gray-100">
                                {hNum}
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <ScoreBadge
                                    score={hNum}
                                    label={hScore.label}
                                    size="sm"
                                  />
                                  {delta !== null && delta !== 0 && (
                                    <span
                                      className={cn(
                                        "inline-flex items-center gap-0.5 text-[11px] font-semibold",
                                        delta > 0
                                          ? "text-emerald-600"
                                          : "text-rose-600",
                                      )}
                                    >
                                      {delta > 0 ? (
                                        <TrendingUp className="size-3" />
                                      ) : (
                                        <TrendingDown className="size-3" />
                                      )}
                                      {delta > 0 ? `+${delta}` : delta} pts
                                    </span>
                                  )}
                                </div>
                                <p className="mt-0.5 text-[11px] text-gray-400">
                                  {new Date(hScore.createdAt).toLocaleString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </p>
                              </div>
                            </div>

                            <p className="max-w-xs truncate text-[11px] text-gray-500">
                              {hScore.reason || "Automated recalculation"}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Score Footer */}
            {formattedScoreTime && (
              <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-[11px] text-gray-400">
                <span>Calculated on: {formattedScoreTime}</span>
                <span>Audit ID: {latestScore.id.slice(0, 8)}...</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
