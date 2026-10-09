"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Flame,
  Globe,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { LeadStatusBadge } from "@/components/leads/LeadStatusBadge";
import { ScoreBadge } from "@/components/leads/ScoreBadge";
import { CreateLeadModal } from "@/components/leads/CreateLeadModal";
import { leadService } from "@/services/lead.service";
import { getReviewTasks } from "@/services/review.service";
import type { LeadScore, LeadStatus } from "@/types/lead";

export default function DashboardPage() {
  const [isCreateLeadOpen, setIsCreateLeadOpen] = React.useState(false);

  // 1. Fetch Leads
  const {
    data: leadsData,
    isLoading: isLeadsLoading,
    refetch: refetchLeads,
  } = useQuery({
    queryKey: ["leads"],
    queryFn: () => leadService.getLeads({ limit: 100 }),
  });

  const leads = React.useMemo(() => leadsData?.data || [], [leadsData?.data]);

  // 2. Fetch Review Tasks
  const {
    data: reviewTasks = [],
    isLoading: isReviewLoading,
    refetch: refetchReviews,
  } = useQuery({
    queryKey: ["review-tasks"],
    queryFn: () => getReviewTasks(),
  });

  // 3. Fetch Scores Map
  const [scoresMap, setScoresMap] = React.useState<Record<string, LeadScore>>({});

  React.useEffect(() => {
    if (leads.length > 0) {
      let isMounted = true;
      Promise.allSettled(
        leads.slice(0, 30).map(async (l) => {
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

  const handleRefresh = () => {
    refetchLeads();
    refetchReviews();
  };

  // Metrics computation
  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter(
    (l) => l.status === "QUALIFIED" || l.status === "CONVERTED",
  ).length;
  const qualificationRate =
    totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0;

  const hotLeads = Object.values(scoresMap).filter((s) => {
    const num = Number(s.score);
    return s.label === "HOT" || num >= 70;
  }).length;

  const pendingReviews = reviewTasks.filter((t) => t.status === "PENDING").length;

  // Status Funnel Counts
  const statusCounts: Record<LeadStatus, number> = {
    NEW: leads.filter((l) => l.status === "NEW").length,
    QUALIFYING: leads.filter((l) => l.status === "QUALIFYING").length,
    QUALIFIED: leads.filter((l) => l.status === "QUALIFIED").length,
    CONTACTED: leads.filter((l) => l.status === "CONTACTED").length,
    PROPOSAL_SENT: leads.filter((l) => l.status === "PROPOSAL_SENT").length,
    NEGOTIATING: leads.filter((l) => l.status === "NEGOTIATING").length,
    CONVERTED: leads.filter((l) => l.status === "CONVERTED").length,
    LOST: leads.filter((l) => l.status === "LOST").length,
  };

  // Source Distribution
  const sourceDistribution = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const lead of leads) {
      const srcName = lead.source?.name || "Direct Web";
      counts[srcName] = (counts[srcName] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [leads]);

  return (
    <div className="min-h-screen bg-[#f7f9f8] text-[#17221c]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-[#e2e8e4] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-xs">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-gray-900">
                CRM Automation Platform
              </h1>
              <p className="text-[11px] text-gray-500">
                AI Intelligence &amp; Autonomous Pipeline Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              E2E Pipeline Online
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="h-8 gap-1 text-xs text-gray-600 hover:text-gray-900"
              title="Refresh all metrics"
            >
              <RefreshCw className="size-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <NotificationBell />

            <Button
              size="sm"
              onClick={() => setIsCreateLeadOpen(true)}
              className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
            >
              <Plus className="size-3.5" />
              New Lead
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto w-full max-w-7xl px-6 py-8 space-y-8">
        {/* Executive Banner */}
        <div className="rounded-3xl bg-gradient-to-br from-emerald-800 via-teal-900 to-[#17221c] p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs font-semibold text-emerald-200 border border-emerald-400/20">
              <Zap className="size-3" />
              <span>FE-04 Executive Overview &amp; E2E Integration</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Enterprise AI CRM Automation Hub
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
              Real-time monitoring across multi-source lead ingestion (UC01), automated AI qualification &amp; scoring (UC02-UC04), human review queues (UC07), customer conversions (UC08), and autonomous follow-up cadences (UC05-UC06).
            </p>
            <div className="pt-2 flex flex-wrap gap-2.5">
              <Button
                asChild
                size="sm"
                className="bg-white text-emerald-950 hover:bg-emerald-50 font-bold text-xs shadow-xs"
              >
                <Link href="/leads">
                  Open Leads Pipeline
                  <ArrowRight className="size-3.5 ml-1.5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-white/30 text-white hover:bg-white/10 font-semibold text-xs"
              >
                <Link href="/review">Human Review Center ({pendingReviews})</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-white/30 text-white hover:bg-white/10 font-semibold text-xs"
              >
                <Link href="/customers">Customers &amp; Segments</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* 4 Primary KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Total Leads */}
          <Card className="border border-gray-200/80 bg-white shadow-xs hover:border-emerald-300 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">
                  Total Active Leads (UC01)
                </span>
                <div className="rounded-xl bg-gray-100 p-2 text-gray-700">
                  <Users className="size-4" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-900">
                  {isLeadsLoading ? "..." : totalLeads}
                </span>
                <span className="text-[11px] font-medium text-emerald-600 flex items-center">
                  <TrendingUp className="size-3 mr-0.5" /> Ingested
                </span>
              </div>
              <p className="mt-1 text-[11px] text-gray-400">
                Real-time pipeline intake from all sources
              </p>
            </CardContent>
          </Card>

          {/* Card 2: AI Qualification Rate */}
          <Card className="border border-emerald-200/80 bg-emerald-50/20 shadow-xs hover:border-emerald-400 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800">
                  AI Qualification Rate (UC02)
                </span>
                <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                  <Bot className="size-4" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-700">
                  {isLeadsLoading ? "..." : `${qualificationRate}%`}
                </span>
                <span className="text-[11px] font-semibold text-emerald-800">
                  {qualifiedLeads} sales-ready
                </span>
              </div>
              <p className="mt-1 text-[11px] text-gray-500">
                Confidence ≥ 80% automated threshold
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Hot Leads Ready to Close */}
          <Card className="border border-amber-200/80 bg-amber-50/20 shadow-xs hover:border-amber-400 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-800">
                  Hot Predictive Leads (UC04)
                </span>
                <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
                  <Flame className="size-4" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-700">
                  {hotLeads}
                </span>
                <span className="text-[11px] font-semibold text-amber-800">
                  ML Score ≥ 70
                </span>
              </div>
              <p className="mt-1 text-[11px] text-gray-500">
                Prime candidates for conversion (UC08)
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Pending Review Tasks */}
          <Card className="border border-purple-200/80 bg-purple-50/20 shadow-xs hover:border-purple-400 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-800">
                  Human Review Tasks (UC07)
                </span>
                <div className="rounded-xl bg-purple-100 p-2 text-purple-700">
                  <ClipboardCheck className="size-4" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-black text-purple-700">
                  {isReviewLoading ? "..." : pendingReviews}
                </span>
                <span className="text-[11px] font-semibold text-purple-800">
                  requires sales action
                </span>
              </div>
              <p className="mt-1 text-[11px] text-gray-500">
                Low confidence / exception edge cases
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Funnel & Source Distribution (2 Columns) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Funnel Card */}
          <Card className="border border-[#e2e8e4] bg-white shadow-xs">
            <CardHeader className="border-b border-[#edf0ee] px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-gray-900">
                    Lead Lifecycle &amp; Conversion Funnel
                  </CardTitle>
                  <p className="text-[11px] text-gray-500">
                    Pipeline distribution across lifecycle status stages
                  </p>
                </div>
                <span className="text-xs font-semibold text-gray-400">
                  {totalLeads} Total Leads
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {[
                { label: "New (Intake)", count: statusCounts.NEW, color: "bg-blue-500" },
                { label: "Qualifying (AI In-Progress)", count: statusCounts.QUALIFYING, color: "bg-purple-500" },
                { label: "Qualified (Sales Ready)", count: statusCounts.QUALIFIED, color: "bg-emerald-500" },
                { label: "Contacted (Active Outreach)", count: statusCounts.CONTACTED, color: "bg-cyan-500" },
                { label: "Converted (Won Customer)", count: statusCounts.CONVERTED, color: "bg-teal-600" },
                { label: "Lost / Disqualified", count: statusCounts.LOST, color: "bg-gray-400" },
              ].map((stage) => {
                const pct = totalLeads > 0 ? Math.round((stage.count / totalLeads) * 100) : 0;
                return (
                  <div key={stage.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700">{stage.label}</span>
                      <span className="font-bold text-gray-900">
                        {stage.count} <span className="text-gray-400 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${stage.color}`}
                        style={{ width: `${Math.max(pct, stage.count > 0 ? 3 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Sources Breakdown Card */}
          <Card className="border border-[#e2e8e4] bg-white shadow-xs">
            <CardHeader className="border-b border-[#edf0ee] px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-gray-900">
                    Acquisition Sources Breakdown
                  </CardTitle>
                  <p className="text-[11px] text-gray-500">
                    Lead inflow by acquisition marketing channels
                  </p>
                </div>
                <span className="text-xs font-semibold text-gray-400">
                  {sourceDistribution.length} Active Channels
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {sourceDistribution.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  No source data available yet.
                </div>
              ) : (
                sourceDistribution.map(([name, count]) => {
                  const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
                  return (
                    <div key={name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                          <Globe className="size-3.5 text-gray-400" />
                          {name}
                        </span>
                        <span className="font-bold text-gray-900">
                          {count} leads <span className="text-gray-400 font-normal">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${Math.max(pct, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Split Grid (Recent Leads & Review Tasks) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Leads */}
          <Card className="border border-[#e2e8e4] bg-white shadow-xs overflow-hidden">
            <CardHeader className="border-b border-[#edf0ee] px-6 py-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-gray-900">
                  Recent Ingested Leads
                </CardTitle>
                <p className="text-[11px] text-gray-500">
                  Latest prospects entered into pipeline
                </p>
              </div>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs font-semibold text-emerald-700">
                <Link href="/leads">
                  View All ({totalLeads})
                  <ArrowRight className="size-3.5 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {leads.slice(0, 5).map((lead) => {
                  const score = scoresMap[lead.id];
                  return (
                    <div
                      key={lead.id}
                      className="p-4 flex items-center justify-between hover:bg-gray-50/60 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="text-xs font-bold text-gray-900 hover:text-emerald-700 transition-colors"
                        >
                          {lead.firstName} {lead.lastName}
                        </Link>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500">
                          <span className="flex items-center gap-1">
                            <Building2 className="size-3 text-gray-400" />
                            {lead.companyName}
                          </span>
                          <span>&bull;</span>
                          <span>{lead.email}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <LeadStatusBadge status={lead.status} />
                        {score && (
                          <ScoreBadge
                            score={score.score}
                            label={score.label}
                            size="sm"
                          />
                        )}
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="size-7 p-0 text-gray-400 hover:text-emerald-700"
                        >
                          <Link href={`/leads/${lead.id}`}>
                            <ArrowRight className="size-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Pending Review Tasks */}
          <Card className="border border-[#e2e8e4] bg-white shadow-xs overflow-hidden">
            <CardHeader className="border-b border-[#edf0ee] px-6 py-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-gray-900">
                  Human Review Tasks Queue (UC07)
                </CardTitle>
                <p className="text-[11px] text-gray-500">
                  Low-confidence qualification reviews
                </p>
              </div>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs font-semibold text-purple-700">
                <Link href="/review">
                  Open Review Inbox
                  <ArrowRight className="size-3.5 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {reviewTasks.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  <CheckCircle2 className="size-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold text-gray-700">Review queue is clear!</p>
                  <p>All automated AI decisions are within threshold.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {reviewTasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="p-4 flex items-center justify-between hover:bg-gray-50/60 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-gray-900">
                          {task.lead?.firstName ? `${task.lead.firstName} ${task.lead.lastName}` : `Lead ID: ${task.leadId.slice(0, 8)}...`}
                        </span>
                        <p className="text-[11px] text-gray-500 truncate max-w-xs">
                          {task.reason || "Manual review requested by AI engine"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          task.status === "PENDING"
                            ? "bg-amber-100 text-amber-800"
                            : task.status === "IN_REVIEW"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {task.status}
                        </span>

                        <Button asChild variant="outline" size="sm" className="h-7 px-2 text-[11px]">
                          <Link href="/review">Review</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Platform Modules Navigation Strip */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider text-xs">
            CRM Modules Quick Navigation
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/leads"
              className="rounded-2xl border border-gray-200 bg-white p-4 hover:border-emerald-500 hover:shadow-xs transition-all flex items-center gap-3.5 group"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Target className="size-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                  Leads Pipeline
                </h4>
                <p className="text-[11px] text-gray-500">UC01, UC03, UC04</p>
              </div>
            </Link>

            <Link
              href="/follow-ups"
              className="rounded-2xl border border-gray-200 bg-white p-4 hover:border-blue-500 hover:shadow-xs transition-all flex items-center gap-3.5 group"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Clock3 className="size-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                  Follow-up Cadences
                </h4>
                <p className="text-[11px] text-gray-500">UC05, UC06 Sequences</p>
              </div>
            </Link>

            <Link
              href="/customers"
              className="rounded-2xl border border-gray-200 bg-white p-4 hover:border-amber-500 hover:shadow-xs transition-all flex items-center gap-3.5 group"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Users className="size-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 group-hover:text-amber-700 transition-colors">
                  Customers &amp; Segments
                </h4>
                <p className="text-[11px] text-gray-500">UC08, UC09 Cohorts</p>
              </div>
            </Link>

            <Link
              href="/review"
              className="rounded-2xl border border-gray-200 bg-white p-4 hover:border-purple-500 hover:shadow-xs transition-all flex items-center gap-3.5 group"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <ClipboardCheck className="size-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                  Review Center
                </h4>
                <p className="text-[11px] text-gray-500">UC07 Human Review</p>
              </div>
            </Link>
          </div>
        </div>
      </main>

      {/* Create Lead Modal */}
      <CreateLeadModal
        isOpen={isCreateLeadOpen}
        onClose={() => setIsCreateLeadOpen(false)}
        onSuccess={() => handleRefresh()}
      />
    </div>
  );
}
