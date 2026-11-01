"use client";
/* Hallmark · v2.0.0 · redesign: full · scope: app · genre: modern-minimal · theme: Cobalt · signature: data quality review queue */

import * as React from "react";
import "../workflows/workflows.css";
import { AlertCircle, Clock3, Loader2, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { WorkflowChrome, WorkflowPageHeading } from "@/components/workflows/WorkflowChrome";
import { ScopeSelector } from "@/components/data-cleaning/ScopeSelector";
import { FindingsTable } from "@/components/data-cleaning/FindingsTable";
import { ApplyConfirmationModal } from "@/components/data-cleaning/ApplyConfirmationModal";
import { ApplySummaryCard } from "@/components/data-cleaning/ApplySummaryCard";
import { dataCleaningService } from "@/services/data-cleaning.service";
import { getApiErrorMessage } from "@/services/api-client";
import type { CreateScanRequest, DataCleaningScanResponse, ApplyCleaningResponse } from "@/types/data-cleaning";

export default function DataCleaningPage() {
  const [activeWorkflowRunId, setActiveWorkflowRunId] = React.useState<string | null>(null);
  const [scanData, setScanData] = React.useState<DataCleaningScanResponse | null>(null);
  const [isStartingScan, setIsStartingScan] = React.useState(false);
  const [isPolling, setIsPolling] = React.useState(false);
  const [selectedFindingIds, setSelectedFindingIds] = React.useState<string[]>([]);
  const [isApplyModalOpen, setIsApplyModalOpen] = React.useState(false);
  const [isApplying, setIsApplying] = React.useState(false);
  const [applyResult, setApplyResult] = React.useState<ApplyCleaningResponse | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!activeWorkflowRunId) return;
    let isMounted = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const fetchStatus = async () => {
      try {
        const data = await dataCleaningService.getScan(activeWorkflowRunId);
        if (!isMounted) return;
        setScanData(data);
        setErrorMessage(null);
        if (data.status === "PENDING" || data.status === "RUNNING") {
          setIsPolling(true);
          timer = setTimeout(fetchStatus, 2500);
        } else {
          setIsPolling(false);
        }
      } catch (error) {
        if (!isMounted) return;
        setIsPolling(false);
        setErrorMessage(getApiErrorMessage(error));
      }
    };

    void fetchStatus();
    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [activeWorkflowRunId]);

  const handleStartScan = async (request: CreateScanRequest) => {
    setIsStartingScan(true);
    setErrorMessage(null);
    setApplyResult(null);
    setSelectedFindingIds([]);
    setScanData(null);
    try {
      const response = await dataCleaningService.startScan(request);
      setIsPolling(true);
      setActiveWorkflowRunId(response.workflowRunId);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsStartingScan(false);
    }
  };

  const handleRefresh = async () => {
    if (!activeWorkflowRunId) return;
    setErrorMessage(null);
    try {
      const response = await dataCleaningService.getScan(activeWorkflowRunId);
      setScanData(response);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedFindingIds((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]);
  };

  const handleSelectAllSafe = () => {
    if (!scanData?.findings) return;
    const safeIds = scanData.findings
      .filter((finding) => finding.safeToApply && finding.proposedValue !== null && finding.proposedValue !== undefined)
      .map((finding) => finding.id);
    setSelectedFindingIds(safeIds);
  };

  const handleClearSelection = () => setSelectedFindingIds([]);

  const handleConfirmApply = async () => {
    if (!activeWorkflowRunId || selectedFindingIds.length === 0) return;
    setIsApplying(true);
    setErrorMessage(null);
    try {
      const response = await dataCleaningService.applyCleaning(activeWorkflowRunId, { acceptedFindingIds: selectedFindingIds });
      setApplyResult(response);
      setIsApplyModalOpen(false);
      setSelectedFindingIds([]);
      await handleRefresh();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsApplying(false);
    }
  };

  const findings = scanData?.findings ?? [];
  const summary = scanData?.summary;
  const selectedFindings = findings.filter((finding) => selectedFindingIds.includes(finding.id));
  const isTerminal = Boolean(scanData && !["PENDING", "RUNNING"].includes(scanData.status));
  const statusTone = scanData?.status === "SUCCESS" ? "wf-state wf-state--success" : scanData?.status === "FAILED" || scanData?.status === "CANCELLED" ? "wf-state wf-state--danger" : "wf-state wf-state--info";

  return (
    <div className="wf-app wf-cleaning">
      <WorkflowChrome />
      <main className="wf-main">
        <div className="wf-screen">
          <WorkflowPageHeading
            code="WF08 · UC10"
            title="AI data cleaning"
            description="Scan lead records for data-quality issues, inspect proposed corrections and explicitly approve the changes to apply. Duplicate candidates remain a human-review task; this screen does not auto-merge records."
          >
            {scanData && <span className={statusTone}>{scanData.status}</span>}
            {activeWorkflowRunId && <button type="button" className="wf-action wf-action--quiet" onClick={() => void handleRefresh()} disabled={isPolling}><RefreshCw size={15} className={isPolling ? "animate-spin" : ""} /> Refresh</button>}
          </WorkflowPageHeading>

          {errorMessage && <div role="alert" className="wf-callout wf-callout--danger"><AlertCircle size={16} /><p>{errorMessage}</p><button type="button" className="wf-inline-link ml-auto shrink-0" onClick={() => setErrorMessage(null)}>Dismiss</button></div>}
          {applyResult && <ApplySummaryCard response={applyResult} onDismiss={() => setApplyResult(null)} />}
          <ScopeSelector onStartScan={handleStartScan} isLoading={isStartingScan || isPolling} />

          {isPolling && <section className="wf-panel" aria-live="polite"><div className="wf-panel__body flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><Loader2 className="size-5 animate-spin text-[var(--wf-accent)]" /><div><h2 className="wf-panel__title">Scan in progress</h2><p className="wf-panel__hint">The backend is coordinating record checks and remediation proposals.</p></div></div><span className="wf-mono">{activeWorkflowRunId}</span></div></section>}

          {summary && <section className="wf-panel" aria-labelledby="wf08-summary-title"><div className="wf-panel__head"><div><h2 id="wf08-summary-title" className="wf-panel__title">Scan summary</h2><p className="wf-panel__hint">Counts returned by the backend for this scan.</p></div><span className={statusTone}>{scanData?.status}</span></div><div className="wf-stat-row"><div className="wf-stat"><p className="wf-stat__label">Leads scanned</p><p className="wf-stat__value">{summary.totalLeadsScanned.toLocaleString()}</p></div><div className="wf-stat"><p className="wf-stat__label">Issues detected</p><p className="wf-stat__value">{summary.totalIssuesFound.toLocaleString()}</p></div><div className="wf-stat"><p className="wf-stat__label">Duplicate candidates</p><p className="wf-stat__value">{summary.duplicatesFound.toLocaleString()}</p></div><div className="wf-stat"><p className="wf-stat__label">Safe to apply</p><p className="wf-stat__value">{summary.safeToApplyCount.toLocaleString()}</p></div></div></section>}

          {scanData && (scanData.status === "PENDING" || scanData.status === "RUNNING") && !isPolling && <div className="wf-callout wf-callout--warning"><Clock3 size={16} /><p>The scan has not reached a terminal state. Use Refresh to check the latest backend status.</p></div>}
          {scanData?.status === "FAILED" && <div className="wf-callout wf-callout--danger"><AlertCircle size={16} /><p>{scanData.errorMessage || "The scan failed. Inspect the backend WorkflowRun and n8n execution for details."}</p></div>}

          {isTerminal && scanData && <section className="wf-panel" aria-labelledby="wf08-findings-title"><div className="wf-panel__head"><div><h2 id="wf08-findings-title" className="wf-panel__title">Findings and remediation proposals</h2><p className="wf-panel__hint">Only selected findings with a non-null proposed value can be submitted for application.</p></div>{scanData.appliedStats?.length ? <span className="wf-state wf-state--success">Last apply: {scanData.appliedStats[scanData.appliedStats.length - 1].appliedCount} item(s)</span> : null}</div><div className="wf-panel__body"><FindingsTable findings={findings} selectedIds={selectedFindingIds} onToggleSelect={handleToggleSelect} onSelectAllSafe={handleSelectAllSafe} onClearSelection={handleClearSelection} onOpenApplyModal={() => setIsApplyModalOpen(true)} isApplying={isApplying} /></div></section>}

          {!scanData && !isStartingScan && <div className="wf-empty"><Users size={22} /><strong>No scan in this session</strong><p>Choose a scope to inspect lead records. Results will appear here with findings and an explicit apply step.</p></div>}
          <div className="wf-callout wf-callout--info"><ShieldCheck size={16} /><p><strong>Human approval stays in control.</strong> The frontend submits selected finding IDs only. The backend validates eligibility and records accepted changes with its audit trail; duplicate records are not merged automatically.</p></div>
        </div>
      </main>
      <ApplyConfirmationModal isOpen={isApplyModalOpen} onClose={() => setIsApplyModalOpen(false)} onConfirm={handleConfirmApply} selectedFindings={selectedFindings} isApplying={isApplying} />
    </div>
  );
}
