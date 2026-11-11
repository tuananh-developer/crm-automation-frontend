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
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/auth/UserNav";
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
import styles from "./data-cleaning.module.css";

export default function DataCleaningPage() {
  const [activeWorkflowRunId, setActiveWorkflowRunId] = React.useState<string | null>(null);
  const [scanData, setScanData] = React.useState<DataCleaningScanResponse | null>(null);
  const [isStartingScan, setIsStartingScan] = React.useState(false);
  const [isPolling, setIsPolling] = React.useState(false);
  const [pollingRevision, setPollingRevision] = React.useState(0);
  const [selectedFindingIds, setSelectedFindingIds] = React.useState<string[]>([]);
  const [isApplyModalOpen, setIsApplyModalOpen] = React.useState(false);
  const [isApplying, setIsApplying] = React.useState(false);
  const [applyResult, setApplyResult] = React.useState<ApplyCleaningResponse | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!activeWorkflowRunId) return;

    let isMounted = true;
    let timer: NodeJS.Timeout;

    const fetchStatus = async () => {
      try {
        const data = await dataCleaningService.getScan(activeWorkflowRunId);
        if (!isMounted) return;
        setScanData(data);

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
  }, [activeWorkflowRunId, pollingRevision]);

  const handleStartScan = async (req: CreateScanRequest) => {
    // Stop displaying and polling the previous run before accepting a new run ID.
    // Otherwise old finding IDs can be submitted against the newly selected run.
    setActiveWorkflowRunId(null);
    setScanData(null);
    setIsPolling(false);
    setIsStartingScan(true);
    setErrorMessage(null);
    setApplyResult(null);
    setSelectedFindingIds([]);

    try {
      const res = await dataCleaningService.startScan(req);
      setIsPolling(true);
      setActiveWorkflowRunId(res.workflowRunId);
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err));
    } finally {
      setIsStartingScan(false);
    }
  };

  const handleRefresh = async () => {
    if (!activeWorkflowRunId) return;
    try {
      const data = await dataCleaningService.getScan(activeWorkflowRunId);
      setScanData(data);
      setErrorMessage(null);
      if (data.status === "PENDING" || data.status === "RUNNING") {
        setIsPolling(true);
        setPollingRevision((revision) => revision + 1);
      } else {
        setIsPolling(false);
      }
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedFindingIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAllSafe = (visibleIds: string[]) => {
    setSelectedFindingIds(visibleIds);
  };

  const handleSelectAll = (visibleIds: string[]) => {
    setSelectedFindingIds(visibleIds);
  };

  const handleClearSelection = () => {
    setSelectedFindingIds([]);
  };

  const handleConfirmApply = async () => {
    if (!activeWorkflowRunId || selectedFindingIds.length === 0) return;
    setIsApplying(true);
    setErrorMessage(null);

    try {
      const response = await dataCleaningService.applyCleaning(activeWorkflowRunId, {
        acceptedFindingIds: selectedFindingIds,
      });
      setApplyResult(response);
      setIsApplyModalOpen(false);
      setSelectedFindingIds([]);
      await handleRefresh();
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err));
    } finally {
      setIsApplying(false);
    }
  };

  const findings = scanData?.findings || [];
  const summary = scanData?.summary;
  const selectedFindings = findings.filter((finding) =>
    selectedFindingIds.includes(finding.id),
  );

  return (
    <div className={styles.page} data-cleaning-workbench>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerStart}>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={styles.backButton}
            >
              <Link href="/">
                <ArrowLeft aria-hidden="true" />
                Dashboard
              </Link>
            </Button>
            <span className={styles.headerRule} aria-hidden="true" />
            <div className={styles.wordmark}>
              <span className={styles.wordmarkIcon} aria-hidden="true">
                <ShieldCheck />
              </span>
              <div>
                <h1>AI CRM Data Cleaning</h1>
                <p>Lead data quality workbench</p>
              </div>
            </div>
          </div>

          <div className={styles.headerEnd}>
            {scanData && <ScanStatusBadge status={scanData.status} />}

            {activeWorkflowRunId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isPolling}
                className={styles.refreshButton}
                title="Refresh scan findings"
              >
                <RefreshCw className={isPolling ? styles.spin : ""} aria-hidden="true" />
                Refresh
              </Button>
            )}

            <Link href="/leads" className={styles.leadsLink}>
              Leads pipeline
            </Link>

            <span className={styles.headerRule} aria-hidden="true" />
            <UserNav />
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.intro}>
          <div>
            <h2>Find the noise in your CRM.</h2>
            <p>
              Scan lead records, inspect each proposed correction, and choose what is written back.
            </p>
          </div>
          {activeWorkflowRunId && (
            <div className={styles.runReference}>
              <span>Current workflow run</span>
              <code>{activeWorkflowRunId}</code>
            </div>
          )}
        </section>

        {errorMessage && (
          <div className={styles.errorBanner} role="alert">
            <AlertCircle aria-hidden="true" />
            <div>
              <strong>We couldn’t complete that request</strong>
              <p>{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className={styles.dismissButton}
              aria-label="Dismiss error"
            >
              Dismiss
            </button>
          </div>
        )}

        {scanData?.status === "FAILED" || scanData?.status === "CANCELLED" ? (
          <div className={styles.scanFailure} role="alert">
            <AlertTriangle aria-hidden="true" />
            <div>
              <strong>Scan {scanData.status === "FAILED" ? "failed" : "was cancelled"}</strong>
              <p>{scanData.errorMessage || "No additional details were returned for this scan."}</p>
            </div>
            <Button type="button" variant="outline" onClick={handleRefresh} className={styles.retryButton}>
              Check again
            </Button>
          </div>
        ) : null}

        {applyResult && (
          <ApplySummaryCard
            response={applyResult}
            onDismiss={() => setApplyResult(null)}
          />
        )}

        <ScopeSelector
          onStartScan={handleStartScan}
          isLoading={isStartingScan || isPolling}
        />

        {isPolling && (
          <section className={styles.progressPanel} data-dc-progress aria-live="polite">
            <div className={styles.progressIcon}>
              <Loader2 className={styles.spin} aria-hidden="true" />
            </div>
            <div className={styles.progressCopy}>
              <strong>Scan is running</strong>
              <p>
                The workflow is processing the selected lead records. Findings will appear here when the run finishes.
              </p>
            </div>
            <span className={styles.progressState}>In progress</span>
          </section>
        )}

        {summary && (
          <section className={styles.summarySection} aria-label="Scan summary">
            <div className={styles.sectionHeading}>
              <div>
                <h2>Scan summary</h2>
                <p>Values returned by this workflow run.</p>
              </div>
              <span className={styles.summaryRun}>
                {scanData?.status ? <ScanStatusBadge status={scanData.status} /> : null}
              </span>
            </div>

            <div className={styles.summaryGrid}>
              <div className={styles.metric}>
                <span>Leads scanned</span>
                <strong>{summary.totalLeadsScanned}</strong>
                <p>Records included in this run</p>
              </div>
              <div className={styles.metric} data-tone="amber">
                <span>Issues detected</span>
                <strong>{summary.totalIssuesFound}</strong>
                <p>Findings returned by the scan</p>
              </div>
              <div className={styles.metric} data-tone="red">
                <span>Duplicate candidates</span>
                <strong>{summary.duplicatesFound}</strong>
                <p>Kept for human review</p>
              </div>
              <div className={styles.metric} data-tone="blue">
                <span>Safe to apply</span>
                <strong>{summary.safeToApplyCount}</strong>
                <p>Non-destructive proposals</p>
              </div>
            </div>
          </section>
        )}

        {scanData && scanData.status !== "PENDING" && scanData.status !== "RUNNING" && scanData.status !== "FAILED" && scanData.status !== "CANCELLED" && (
          <section className={styles.findingsSection}>
            <div className={styles.sectionHeading}>
              <div>
                <h2>Review findings</h2>
                <p>Compare the current value with the proposed correction before applying changes.</p>
              </div>
              {scanData.appliedStats && scanData.appliedStats.length > 0 && (
                <span className={styles.appliedCount}>
                  {scanData.appliedStats[scanData.appliedStats.length - 1].appliedCount} applied previously
                </span>
              )}
            </div>

            <FindingsTable
              key={activeWorkflowRunId ?? scanData.workflowRunId}
              scanStatus={scanData.status}
              findings={findings}
              selectedIds={selectedFindingIds}
              onToggleSelect={handleToggleSelect}
              onSelectAllSafe={handleSelectAllSafe}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              onOpenApplyModal={() => setIsApplyModalOpen(true)}
              isApplying={isApplying}
            />
          </section>
        )}
      </main>

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
