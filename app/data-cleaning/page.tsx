"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/auth/UserNav";
import { Card, CardContent } from "@/components/ui/card";
import { ScopeSelector } from "@/components/data-cleaning/ScopeSelector";
import { FindingsTable } from "@/components/data-cleaning/FindingsTable";
import { ScanStatusBadge } from "@/components/data-cleaning/ScanStatusBadge";
import { ApplyConfirmationModal } from "@/components/data-cleaning/ApplyConfirmationModal";
import { ApplySummaryCard } from "@/components/data-cleaning/ApplySummaryCard";
import { dataCleaningService } from "@/services/data-cleaning.service";
import { getApiErrorMessage } from "@/services/api-client";
import type {
  CreateScanRequest,
  DataCleaningScanResponse,
  ApplyCleaningResponse,
} from "@/types/data-cleaning";

export default function DataCleaningPage() {
  // State
  const [activeWorkflowRunId, setActiveWorkflowRunId] = React.useState<string | null>(null);
  const [scanData, setScanData] = React.useState<DataCleaningScanResponse | null>(null);
  const [isStartingScan, setIsStartingScan] = React.useState(false);
  const [isPolling, setIsPolling] = React.useState(false);
  const [selectedFindingIds, setSelectedFindingIds] = React.useState<string[]>([]);
  const [isApplyModalOpen, setIsApplyModalOpen] = React.useState(false);
  const [isApplying, setIsApplying] = React.useState(false);
  const [applyResult, setApplyResult] = React.useState<ApplyCleaningResponse | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Poll scan status until finished or failed
  React.useEffect(() => {
    if (!activeWorkflowRunId) return;

    let isMounted = true;
    let timer: NodeJS.Timeout;

    const fetchStatus = async () => {
      try {
        const data = await dataCleaningService.getScan(activeWorkflowRunId);
        if (!isMounted) return;
        setScanData(data);

        // Keep polling if PENDING or RUNNING
        if (data.status === "PENDING" || data.status === "RUNNING") {
          setIsPolling(true);
          timer = setTimeout(fetchStatus, 2500);
        } else {
          setIsPolling(false);
        }
      } catch (err) {
        if (!isMounted) return;
        setIsPolling(false);
        setErrorMessage(getApiErrorMessage(err));
      }
    };

    fetchStatus();

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [activeWorkflowRunId]);

  // Handler: Start a new scan
  const handleStartScan = async (req: CreateScanRequest) => {
    setIsStartingScan(true);
    setErrorMessage(null);
    setApplyResult(null);
    setSelectedFindingIds([]);

    try {
      const res = await dataCleaningService.startScan(req);
      setActiveWorkflowRunId(res.workflowRunId);
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err));
    } finally {
      setIsStartingScan(false);
    }
  };

  // Handler: Manual refresh
  const handleRefresh = async () => {
    if (!activeWorkflowRunId) return;
    try {
      const data = await dataCleaningService.getScan(activeWorkflowRunId);
      setScanData(data);
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err));
    }
  };

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedFindingIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAllSafe = () => {
    if (!scanData?.findings) return;
    const safeIds = scanData.findings
      .filter((f) => f.safeToApply && !!f.proposedValue)
      .map((f) => f.id);
    setSelectedFindingIds(safeIds);
  };

  const handleSelectAll = () => {
    if (!scanData?.findings) return;
    const allIds = scanData.findings
      .filter((f) => !!f.proposedValue)
      .map((f) => f.id);
    setSelectedFindingIds(allIds);
  };

  const handleClearSelection = () => {
    setSelectedFindingIds([]);
  };

  // Handler: Apply confirmed changes
  const handleConfirmApply = async () => {
    if (!activeWorkflowRunId || selectedFindingIds.length === 0) return;
    setIsApplying(true);
    setErrorMessage(null);

    try {
      const res = await dataCleaningService.applyCleaning(activeWorkflowRunId, {
        acceptedFindingIds: selectedFindingIds,
      });
      setApplyResult(res);
      setIsApplyModalOpen(false);
      setSelectedFindingIds([]);
      // Refresh scan data to show updated stats
      await handleRefresh();
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err));
    } finally {
      setIsApplying(false);
    }
  };

  const findings = scanData?.findings || [];
  const summary = scanData?.summary;
  const selectedFindings = findings.filter((f) =>
    selectedFindingIds.includes(f.id),
  );

  return (
    <div className="min-h-screen bg-[#f7f9f8] text-[#17221c]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[#e2e8e4] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-xs text-gray-600 hover:text-gray-900"
            >
              <Link href="/">
                <ArrowLeft className="size-3.5" />
                Dashboard
              </Link>
            </Button>
            <div className="h-4 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                <Sparkles className="size-4" />
              </div>
              <h1 className="text-sm font-bold tracking-tight text-gray-900">
                AI CRM Data Cleaning Agent (UC10)
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {scanData && <ScanStatusBadge status={scanData.status} />}

            {activeWorkflowRunId && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isPolling}
                className="h-8 gap-1 text-xs text-gray-600 hover:text-gray-900"
                title="Refresh scan findings"
              >
                <RefreshCw
                  className={`size-3.5 ${isPolling ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            )}

            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-8 text-xs text-emerald-800 border-emerald-200 hover:bg-emerald-50"
            >
              <Link href="/leads">View Leads Pipeline</Link>
            </Button>

            <div className="h-4 w-px bg-gray-200" />

            <UserNav />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl px-6 py-8 space-y-6">
        {/* Banner */}
        <div className="rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-950 to-[#121c17] p-6 sm:p-7 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-200 border border-emerald-400/20">
              <ShieldCheck className="size-3.5" />
              <span>Autonomous Data Quality &amp; Governance Engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Enterprise Lead Data Cleaning &amp; Deduplication
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Scan existing Lead database records to detect syntax errors, invalid emails/URLs, formatting anomalies, and duplicate candidates. Gemini AI synthesizes high-confidence remediation proposals applied with human confirmation and AuditLog.
            </p>
          </div>
        </div>

        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800 flex items-start gap-2.5 shadow-xs">
            <AlertCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 flex-1">
              <span className="font-bold">Error Notice:</span>
              <p>{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-600 hover:text-rose-900"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Apply Results Card if just applied */}
        {applyResult && (
          <ApplySummaryCard
            response={applyResult}
            onDismiss={() => setApplyResult(null)}
          />
        )}

        {/* Scope Selector Form */}
        <ScopeSelector
          onStartScan={handleStartScan}
          isLoading={isStartingScan || isPolling}
        />

        {/* Active Scan Progress if Polling */}
        {isPolling && (
          <Card className="border border-blue-200 bg-blue-50/20 shadow-xs">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Loader2 className="size-5 text-blue-600 animate-spin" />
                <div>
                  <h3 className="text-xs font-bold text-blue-900">
                    Data Cleaning Agent Running in Background...
                  </h3>
                  <p className="text-[11px] text-blue-700">
                    RabbitMQ message ingested by n8n. Fetching lead batch, running rule-based audits, and querying Gemini AI for ambiguous proposals.
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs text-blue-800 bg-blue-100 px-2 py-1 rounded">
                Run ID: {activeWorkflowRunId?.slice(0, 8)}...
              </span>
            </CardContent>
          </Card>
        )}

        {/* KPI Metrics Summary (if scan completed) */}
        {summary && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border border-gray-200/80 bg-white shadow-xs">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase">
                    Leads Scanned
                  </span>
                  <div className="rounded-lg bg-gray-100 p-1.5 text-gray-700">
                    <Users className="size-3.5" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black text-gray-900">
                  {summary.totalLeadsScanned}
                </div>
                <p className="mt-0.5 text-[10px] text-gray-400">
                  Targeted batch evaluated
                </p>
              </CardContent>
            </Card>

            <Card className="border border-amber-200/80 bg-amber-50/20 shadow-xs">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-amber-800 uppercase">
                    Issues Detected
                  </span>
                  <div className="rounded-lg bg-amber-100 p-1.5 text-amber-700">
                    <AlertTriangle className="size-3.5" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black text-amber-950">
                  {summary.totalIssuesFound}
                </div>
                <p className="mt-0.5 text-[10px] text-amber-700">
                  Across missing, syntax &amp; format checks
                </p>
              </CardContent>
            </Card>

            <Card className="border border-rose-200/80 bg-rose-50/20 shadow-xs">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-rose-800 uppercase">
                    Duplicate Candidates
                  </span>
                  <div className="rounded-lg bg-rose-100 p-1.5 text-rose-700">
                    <ShieldAlert className="size-3.5" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black text-rose-950">
                  {summary.duplicatesFound}
                </div>
                <p className="mt-0.5 text-[10px] text-rose-700">
                  Flagged for manual review (no auto-merge)
                </p>
              </CardContent>
            </Card>

            <Card className="border border-emerald-200/80 bg-emerald-50/20 shadow-xs">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-800 uppercase">
                    Safe to Apply
                  </span>
                  <div className="rounded-lg bg-emerald-100 p-1.5 text-emerald-700">
                    <ShieldCheck className="size-3.5" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black text-emerald-950">
                  {summary.safeToApplyCount}
                </div>
                <p className="mt-0.5 text-[10px] text-emerald-700">
                  Deterministic, non-destructive cleanups
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Findings Table Section */}
        {scanData && scanData.status !== "PENDING" && scanData.status !== "RUNNING" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Detected Findings &amp; AI Remediation Proposals
                </h3>
                <p className="text-[11px] text-gray-500">
                  Select which items you approve to be cleaned in database
                </p>
              </div>

              {scanData.appliedStats && scanData.appliedStats.length > 0 && (
                <div className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Previously applied: {scanData.appliedStats[scanData.appliedStats.length - 1].appliedCount} item(s)
                </div>
              )}
            </div>

            <FindingsTable
              findings={findings}
              selectedIds={selectedFindingIds}
              onToggleSelect={handleToggleSelect}
              onSelectAllSafe={handleSelectAllSafe}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              onOpenApplyModal={() => setIsApplyModalOpen(true)}
              isApplying={isApplying}
            />
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      <ApplyConfirmationModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onConfirm={handleConfirmApply}
        selectedFindings={selectedFindings}
        isApplying={isApplying}
      />
    </div>
  );
}
