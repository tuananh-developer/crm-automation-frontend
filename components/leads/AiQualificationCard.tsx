"use client";
/* Hallmark · v2.0.0 · redesign: component · scope: app · genre: modern-minimal · theme: Cobalt · signature: qualification review panel */

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
import { Button } from "@/components/ui/button";
import { leadService } from "@/services/lead.service";
import type { Lead, QualificationStatus } from "@/types/lead";

export interface AiQualificationCardProps {
  lead: Lead;
  onRefresh?: () => void;
}

function getStatusBadge(status?: QualificationStatus) {
  if (status === "QUALIFIED") return <span className="wf-state wf-state--success"><CheckCircle2 size={14} /> Qualified</span>;
  if (status === "UNQUALIFIED") return <span className="wf-state wf-state--danger"><XCircle size={14} /> Unqualified</span>;
  if (status === "NEEDS_REVIEW") return <span className="wf-state wf-state--warning"><AlertTriangle size={14} /> Needs review</span>;
  return <span className="wf-state wf-state--info"><HelpCircle size={14} /> Not evaluated</span>;
}

export function AiQualificationCard({
  lead,
  onRefresh,
}: AiQualificationCardProps) {
  const queryClient = useQueryClient();
  const [showHistory, setShowHistory] = React.useState(false);
  const [pendingWorkflowRunId, setPendingWorkflowRunId] = React.useState<string | null>(null);
  const [pendingStartedAt, setPendingStartedAt] = React.useState<number | null>(null);
  const [pollingExpired, setPollingExpired] = React.useState(false);

  // Fetch latest qualification
  const {
    data: qualification,
    isLoading: isQualLoading,
    error: qualificationError,
    refetch: refetchQualification,
  } = useQuery({
    queryKey: ["lead-qualification", lead.id],
    queryFn: () => leadService.getLatestQualification(lead.id),
    refetchInterval: (query) => {
      if (!pendingWorkflowRunId || !pendingStartedAt) return false;
      if (query.state.data?.workflowRunId === pendingWorkflowRunId) return false;
      return Date.now() - pendingStartedAt < 180_000 ? 3000 : false;
    },
  });

  React.useEffect(() => {
    if (!pendingWorkflowRunId || !pendingStartedAt) return;
    const timeout = window.setTimeout(() => setPollingExpired(true), 180_000);
    return () => window.clearTimeout(timeout);
  }, [pendingWorkflowRunId, pendingStartedAt]);

  React.useEffect(() => {
    if (pendingWorkflowRunId && qualification?.workflowRunId === pendingWorkflowRunId) {
      setPendingWorkflowRunId(null);
      setPendingStartedAt(null);
      setPollingExpired(false);
    }
  }, [pendingWorkflowRunId, qualification?.workflowRunId]);

  // Fetch qualification history
  const { data: history = [], isLoading: historyLoading, error: historyError, refetch: refetchHistory } = useQuery({
    queryKey: ["lead-qualification-history", lead.id],
    queryFn: () => leadService.getQualificationHistory(lead.id),
    enabled: showHistory,
  });

  // Trigger qualification mutation
  const triggerMutation = useMutation({
    mutationFn: () => leadService.triggerQualification(lead.id),
    onSuccess: (result) => {
      setPollingExpired(false);
      setPendingWorkflowRunId(result.workflowRunId);
      setPendingStartedAt(Date.now());
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
    <section className="wf-panel wf-qualification" aria-labelledby="wf01-qualification-title">
      <div className="wf-panel__head">
        <div>
          <h2 id="wf01-qualification-title" className="wf-panel__title flex items-center gap-2"><Bot size={17} /> AI Lead Qualification</h2>
          <p className="wf-panel__hint">Assess lead intent and route uncertain results for human review.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => triggerMutation.mutate()} disabled={triggerMutation.isPending || isQualLoading}>
          {triggerMutation.isPending ? <><Loader2 className="size-4 animate-spin" /> Submitting…</> : <><Sparkles className="size-4" /> Run assessment</>}
        </Button>
      </div>
      <div className="wf-panel__body">
        {pendingWorkflowRunId && <div className="wf-callout wf-callout--info" role="status">
          {pollingExpired ? <Clock size={16} /> : <Loader2 size={16} className="animate-spin" />}
          <div className="min-w-0 flex-1"><strong>{pollingExpired ? "Qualification is taking longer than expected" : "Qualification is processing"}</strong><p className="wf-subtle mt-1">{pollingExpired ? "Automatic polling stopped after three minutes. Refresh the result manually or inspect the workflow execution." : "The latest result is checked every three seconds for up to three minutes."} WorkflowRun: <span className="wf-mono">{pendingWorkflowRunId}</span></p>{pollingExpired && <button type="button" className="wf-inline-link mt-2" onClick={() => void refetchQualification()}>Refresh result</button>}</div>
        </div>}
        {triggerMutation.error && <div role="alert" className="wf-callout wf-callout--danger"><XCircle size={15} /><p>{triggerMutation.error instanceof Error ? triggerMutation.error.message : "Could not start the qualification workflow."}</p></div>}
        {qualificationError && <div role="alert" className="wf-callout wf-callout--danger"><XCircle size={15} /><p>Could not load qualification result. <button type="button" className="wf-inline-link" onClick={() => void refetchQualification()}>Retry</button></p></div>}
        {isQualLoading ? <div className="wf-loading"><Loader2 size={16} className="animate-spin" /> Loading qualification result…</div> : !qualification ? <div className="wf-empty"><Bot size={22} /><strong>No qualification run recorded</strong><p>Run an assessment to evaluate firmographics, role and intent signals for this lead.</p><Button type="button" size="sm" onClick={() => triggerMutation.mutate()} disabled={triggerMutation.isPending}>Evaluate lead</Button></div> : <div className="wf-stack">
          <div className="wf-qualification__metrics">
            <div className="wf-qualification__metric"><span className="wf-field-label">Decision outcome</span><div className="mt-2">{getStatusBadge(qualification.status)}</div>{qualification.intent && <p className="wf-subtle mt-2">Detected intent: <strong>{qualification.intent}</strong></p>}</div>
            <div className="wf-qualification__metric"><div className="flex items-center justify-between gap-2"><span className="wf-field-label">Confidence</span><strong className="text-lg tabular-nums">{confidencePercentage !== null ? `${confidencePercentage}%` : "Not available"}</strong></div>{confidencePercentage !== null && <><div className="wf-progress mt-3"><div className="wf-progress__fill" style={{ width: `${Math.max(0, Math.min(100, confidencePercentage))}%` }} /></div><p className="wf-field-help mt-2">Auto-qualification threshold: 80%. Lower confidence is routed for review according to backend policy.</p></>}</div>
          </div>
          {qualification.reason && <section className="wf-result-block"><h3 className="wf-result-heading">Qualification rationale</h3><p className="wf-result-copy">{qualification.reason}</p></section>}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--wf-rule)] pt-3"><div className="flex flex-wrap gap-x-4 gap-y-2"><span className="wf-subtle flex items-center gap-1"><Cpu size={13} /> Provider: <strong>{qualification.modelProvider || "Not reported"}</strong></span>{qualification.modelVersion && <span className="wf-subtle">Model: <strong>{qualification.modelVersion}</strong></span>}<span className="wf-subtle flex items-center gap-1"><Clock size={13} /> {new Date(qualification.createdAt).toLocaleString()}</span></div><button type="button" className="wf-inline-link" aria-expanded={showHistory} onClick={() => setShowHistory((current) => !current)}>{showHistory ? "Hide history" : "View history"} <ArrowRight size={13} className="inline" /></button></div>
          {showHistory && <section className="wf-result-block"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="wf-result-heading">Previous assessments ({history.length})</h3><button type="button" className="wf-inline-link" onClick={() => void refetchHistory()} disabled={historyLoading}>Refresh history</button></div>{historyLoading ? <div className="wf-loading"><Loader2 size={15} className="animate-spin" /> Loading history…</div> : historyError ? <div role="alert" className="wf-callout wf-callout--danger mt-3"><AlertTriangle size={15} /><p>Could not load assessment history. <button type="button" className="wf-inline-link" onClick={() => void refetchHistory()}>Retry</button></p></div> : history.length === 0 ? <p className="wf-subtle mt-2">No previous assessments were returned.</p> : <div className="wf-list mt-2">{history.map((item) => <div key={item.id} className="wf-list__item"><div className="min-w-0"><div>{getStatusBadge(item.status)}</div><p className="wf-list__item-description">{item.reason || item.intent || "No rationale returned"}</p></div><time className="wf-subtle shrink-0">{new Date(item.createdAt).toLocaleDateString()}</time></div>)}</div>}</section>}
        </div>}
      </div>
    </section>
  );

}
