"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  Bot,
  CheckCircle2,
  Clock3,
  Cpu,
  HelpCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { leadService } from "@/services/lead.service";
import { getApiErrorMessage } from "@/services/api-client";
import type { Lead, QualificationStatus } from "@/types/lead";
import styles from "./ai-qualification-card.module.css";

export interface AiQualificationCardProps {
  lead: Lead;
  onRefresh?: () => void;
}

function StatusMark({ status }: { status?: QualificationStatus }) {
  switch (status) {
    case "QUALIFIED":
      return (
        <span className={styles.statusQualified}>
          <CheckCircle2 aria-hidden="true" />
          Qualified
        </span>
      );
    case "UNQUALIFIED":
      return (
        <span className={styles.statusUnqualified}>
          <XCircle aria-hidden="true" />
          Unqualified
        </span>
      );
    case "NEEDS_REVIEW":
      return (
        <span className={styles.statusReview}>
          <AlertTriangle aria-hidden="true" />
          Needs human review
        </span>
      );
    default:
      return (
        <span className={styles.statusUnknown}>
          <HelpCircle aria-hidden="true" />
          Not evaluated
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

  const {
    data: qualification,
    isLoading: isQualLoading,
    isError: isQualError,
    error: qualificationError,
    refetch: refetchQualification,
  } = useQuery({
    queryKey: ["lead-qualification", lead.id],
    queryFn: () => leadService.getLatestQualification(lead.id),
  });

  const {
    data: history = [],
    isLoading: isHistoryLoading,
    isError: isHistoryError,
    error: historyError,
  } = useQuery({
    queryKey: ["lead-qualification-history", lead.id],
    queryFn: () => leadService.getQualificationHistory(lead.id),
    enabled: showHistory,
  });

  const triggerMutation = useMutation({
    mutationFn: () => leadService.triggerQualification(lead.id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["lead-qualification", lead.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["lead-qualification-history", lead.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["lead-detail", lead.id],
      });
      if (onRefresh) onRefresh();
    },
  });

  const rawConfidence = Number(qualification?.confidence);
  const confidencePercentage =
    qualification?.confidence !== null &&
    qualification?.confidence !== undefined &&
    Number.isFinite(rawConfidence)
      ? Math.round(rawConfidence * 100)
      : null;
  const confidenceWidth =
    confidencePercentage === null
      ? "0%"
      : `${Math.min(100, Math.max(0, confidencePercentage))}%`;

  const runAssessment = () => triggerMutation.mutate();

  return (
    <section className={styles.panel} data-wf01-qualification aria-labelledby="wf01-qualification-title">
      <header className={styles.header}>
        <div className={styles.heading}>
          <div className={styles.icon} aria-hidden="true">
            <Bot />
          </div>
          <div className={styles.headingText}>
            <h3 id="wf01-qualification-title">AI lead qualification</h3>
            <p>Decision, confidence and the reasoning behind this assessment.</p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={runAssessment}
          disabled={triggerMutation.isPending || isQualLoading}
          aria-busy={triggerMutation.isPending}
          className={styles.runButton}
        >
          {triggerMutation.isPending ? (
            <>
              <Loader2 className={styles.spin} aria-hidden="true" />
              Assessing
            </>
          ) : (
            <>
              <RefreshCw aria-hidden="true" />
              Run assessment
            </>
          )}
        </Button>
      </header>

      <div className={styles.body}>
        {isQualLoading ? (
          <div className={styles.loadingState} role="status" aria-live="polite">
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonValue} />
            <div className={styles.skeletonLineShort} />
            <span>Loading the latest qualification result</span>
          </div>
        ) : isQualError ? (
          <div className={styles.errorState} role="alert">
            <AlertCircle aria-hidden="true" />
            <div>
              <strong>Qualification could not be loaded</strong>
              <p>{getApiErrorMessage(qualificationError)}</p>
              <button type="button" onClick={() => refetchQualification()} className={styles.inlineAction}>
                Try again
              </button>
            </div>
          </div>
        ) : !qualification ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyMark} aria-hidden="true">
              <Bot />
            </div>
            <div className={styles.emptyCopy}>
              <strong>No assessment has been recorded</strong>
              <p>Run qualification to evaluate this lead against the current sales-readiness criteria.</p>
            </div>
            <Button
              type="button"
              onClick={runAssessment}
              disabled={triggerMutation.isPending}
              aria-busy={triggerMutation.isPending}
              className={styles.emptyButton}
            >
              {triggerMutation.isPending ? (
                <>
                  <Loader2 className={styles.spin} aria-hidden="true" />
                  Assessing
                </>
              ) : (
                <>
                  <Sparkles aria-hidden="true" />
                  Assess this lead
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className={styles.result}>
            <div className={styles.decisionRow}>
              <div className={styles.decision}>
                <span className={styles.sectionLabel}>Decision</span>
                <StatusMark status={qualification.status} />
                {qualification.intent && (
                  <p className={styles.intent}>
                    <span>Detected intent</span>
                    <strong>{qualification.intent}</strong>
                  </p>
                )}
              </div>

              <div className={styles.confidence}>
                <div className={styles.confidenceTop}>
                  <span className={styles.sectionLabel}>Model confidence</span>
                  <strong className={styles.confidenceValue}>
                    {confidencePercentage !== null ? `${confidencePercentage}%` : "Not available"}
                  </strong>
                </div>
                {confidencePercentage !== null ? (
                  <>
                    <div
                      className={styles.meter}
                      role="progressbar"
                      aria-label="Qualification confidence"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.min(100, Math.max(0, confidencePercentage))}
                    >
                      <span style={{ width: confidenceWidth }} />
                    </div>
                    <p className={styles.threshold}>Auto-qualification threshold: 80%</p>
                  </>
                ) : (
                  <p className={styles.threshold}>The model did not return a confidence value.</p>
                )}
              </div>
            </div>

            {qualification.reason && (
              <div className={styles.reason}>
                <div className={styles.reasonHeading}>
                  <Sparkles aria-hidden="true" />
                  <strong>Why this decision</strong>
                </div>
                <p>{qualification.reason}</p>
              </div>
            )}

            <div className={styles.metadata}>
              <div className={styles.metadataGroup}>
                <span>
                  <Cpu aria-hidden="true" />
                  {qualification.modelProvider || "Google Gemini"}
                </span>
                {qualification.modelVersion && <span>Version {qualification.modelVersion}</span>}
                <span>
                  <Clock3 aria-hidden="true" />
                  {new Date(qualification.createdAt).toLocaleString([], {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowHistory((current) => !current)}
                aria-expanded={showHistory}
                className={styles.historyToggle}
              >
                {showHistory ? "Hide history" : "View history"}
                <ArrowDown className={showHistory ? styles.chevronOpen : ""} aria-hidden="true" />
              </button>
            </div>

            {showHistory && (
              <div className={styles.history} aria-label="Qualification history">
                <div className={styles.historyHeading}>
                  <strong>Previous assessments</strong>
                  <span>{history.length} records</span>
                </div>
                {isHistoryLoading ? (
                  <p className={styles.historyMessage} role="status">Loading assessment history…</p>
                ) : isHistoryError ? (
                  <p className={styles.historyError} role="alert">
                    {getApiErrorMessage(historyError)}
                  </p>
                ) : history.length === 0 ? (
                  <p className={styles.historyMessage}>There are no earlier assessments for this lead.</p>
                ) : (
                  <ul className={styles.historyList}>
                    {history.map((item) => (
                      <li key={item.id}>
                        <StatusMark status={item.status} />
                        <span className={styles.historyReason}>
                          {item.reason || item.intent || "No explanation returned"}
                        </span>
                        <time dateTime={item.createdAt}>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </time>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {triggerMutation.isError && (
          <div className={styles.mutationError} role="alert">
            <AlertCircle aria-hidden="true" />
            <span>{getApiErrorMessage(triggerMutation.error)}</span>
          </div>
        )}
      </div>
    </section>
  );
}
