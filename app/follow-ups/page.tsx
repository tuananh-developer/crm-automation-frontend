"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Sliders, Clock3 } from "lucide-react";
import { SequenceList } from "@/components/follow-ups/SequenceList";
import { FollowUpExecutionTimeline } from "@/components/follow-ups/FollowUpExecutionTimeline";

function FollowUpsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const activeTab: "sequences" | "executions" =
    tabParam === "executions" ? "executions" : "sequences";

  const switchTab = (tab: "sequences" | "executions") => {
    router.replace(`/follow-ups?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      {/* Top Tab Navigator */}
      <div className="flex border-b border-[#e2e8e4]">
        <button
          type="button"
          onClick={() => switchTab("sequences")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-all ${
            activeTab === "sequences"
              ? "border-emerald-700 text-emerald-900 bg-emerald-50/30"
              : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800"
          }`}
        >
          <Sliders className="size-4 text-emerald-700" />
          <span>Cadence Sequences (UC05)</span>
        </button>

        <button
          type="button"
          onClick={() => switchTab("executions")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-all ${
            activeTab === "executions"
              ? "border-emerald-700 text-emerald-900 bg-emerald-50/30"
              : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800"
          }`}
        >
          <Clock3 className="size-4 text-emerald-700" />
          <span>Execution History &amp; Logs (UC06)</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "sequences" ? (
        <SequenceList />
      ) : (
        <FollowUpExecutionTimeline />
      )}
    </div>
  );
}

/**
 * /follow-ups — Follow-Up Studio:
 *  - Tab "sequences" (UC05): Sequence catalog, builder, step configuration, and lead enrollment.
 *  - Tab "executions" (UC06): Execution history timeline, dispatch logs, and retry steps.
 */
export default function FollowUpsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-32 items-center justify-center">
          <div className="size-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        </div>
      }
    >
      <FollowUpsContent />
    </Suspense>
  );
}