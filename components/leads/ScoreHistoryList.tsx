"use client";

import * as React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { ScoreBadge } from "@/components/leads/ScoreBadge";
import type { LeadScore } from "@/types/lead";
import { cn } from "@/lib/utils";

interface ScoreHistoryListProps {
  historyScores: LeadScore[];
  className?: string;
}

export function ScoreHistoryList({
  historyScores,
  className,
}: ScoreHistoryListProps) {
  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "Recorded";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Recorded";
    const pad = (n: number) => n.toString().padStart(2, "0");
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  if (!historyScores || historyScores.length === 0) {
    return (
      <p className="text-xs text-gray-400 py-2">
        No previous scoring history recorded.
      </p>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
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
                  <ScoreBadge score={hNum} label={hScore.label} size="sm" />
                  {delta !== null && delta !== 0 && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 text-[11px] font-semibold",
                        delta > 0 ? "text-emerald-600" : "text-rose-600",
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
                  {formatDateTime(hScore.createdAt)}
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
  );
}
