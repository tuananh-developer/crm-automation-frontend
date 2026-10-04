"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Brain, Flame, Sparkles, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LeadListTable } from "@/components/leads/LeadListTable";
import { leadService } from "@/services/lead.service";
import type { LeadScore } from "@/types/lead";

export default function LeadsPage() {
  const { data: leadsData, isLoading: isLeadsLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => leadService.getLeads({ limit: 50 }),
  });

  const leads = React.useMemo(() => leadsData?.data || [], [leadsData?.data]);

  // Fetch latest scores for each lead so the directory displays real-time score badges
  const [scoresMap, setScoresMap] = React.useState<Record<string, LeadScore>>({});

  React.useEffect(() => {
    if (leads.length > 0) {
      let isMounted = true;
      Promise.allSettled(
        leads.map(async (l) => {
          const score = await leadService.getLatestScore(l.id);
          return { leadId: l.id, score };
        }),
      ).then((results) => {
        if (!isMounted) return;
        const newMap: Record<string, LeadScore> = {};
        for (const res of results) {
          if (res.status === "fulfilled" && res.value.score) {
            newMap[res.value.leadId] = res.value.score;
          }
        }
        setScoresMap(newMap);
      });

      return () => {
        isMounted = false;
      };
    }
  }, [leads]);

  // Aggregate stats
  const totalLeads = leads.length;
  const scoredCount = Object.keys(scoresMap).length;
  const hotLeadsCount = Object.values(scoresMap).filter((s) => {
    const num = Number(s.score);
    return s.label === "HOT" || num >= 75;
  }).length;
  const enrichedCount = leads.filter(
    (l) => !!l.companySize || !!l.industry,
  ).length;

  return (
    <div className="space-y-6">
      {/* Page Title & Intro */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Leads Pipeline &amp; AI Intelligence
          </h2>
          <p className="text-xs text-gray-500">
            Multi-source company enrichment (UC03) &amp; predictive machine
            learning lead scoring (UC04)
          </p>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Leads */}
        <Card className="border-gray-200/80 bg-white shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">
                Total Leads
              </span>
              <div className="rounded-lg bg-gray-100 p-2 text-gray-600">
                <Users className="size-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-gray-900">
                {isLeadsLoading ? "..." : totalLeads}
              </span>
              <span className="text-[11px] text-gray-500">active pipeline</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Hot Leads */}
        <Card className="border-emerald-200/80 bg-emerald-50/20 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800">
                🔥 Hot Leads (Score ≥ 75)
              </span>
              <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                <Flame className="size-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700">
                {hotLeadsCount}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium">
                high conversion readiness
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Enriched Profiles */}
        <Card className="border-blue-200/80 bg-blue-50/20 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-800">
                Enriched Profiles (UC03)
              </span>
              <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                <Sparkles className="size-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-blue-700">
                {enrichedCount} / {totalLeads}
              </span>
              <span className="text-[11px] text-blue-600 font-medium">
                {totalLeads > 0
                  ? `${Math.round((enrichedCount / totalLeads) * 100)}% coverage`
                  : "0%"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: AI Scored */}
        <Card className="border-purple-200/80 bg-purple-50/20 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-800">
                AI Scored (UC04)
              </span>
              <div className="rounded-lg bg-purple-100 p-2 text-purple-700">
                <Brain className="size-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-purple-700">
                {scoredCount} / {totalLeads}
              </span>
              <span className="text-[11px] text-purple-600 font-medium">
                ML-evaluated
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Directory Table */}
      <LeadListTable
        leads={leads}
        scoresMap={scoresMap}
        isLoading={isLeadsLoading}
      />
    </div>
  );
}
