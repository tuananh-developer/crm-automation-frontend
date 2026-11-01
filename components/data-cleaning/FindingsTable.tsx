"use client";
/* Hallmark · v2.0.0 · redesign: component · scope: app · signature: reviewable findings table */

import * as React from "react";
import { AlertTriangle, Check, EyeOff, Filter, ShieldAlert, ShieldCheck } from "lucide-react";
import type { DataCleaningFinding, IssueType, Severity } from "@/types/data-cleaning";

function hasProposedValue(value: unknown): boolean {
  return value !== null && value !== undefined;
}

interface FindingsTableProps {
  findings: DataCleaningFinding[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAllSafe: () => void;
  onClearSelection: () => void;
  onOpenApplyModal: () => void;
  isApplying: boolean;
}

function issueLabel(type: IssueType) {
  const labels: Record<IssueType, string> = {
    DUPLICATE_CANDIDATE: "Duplicate candidate",
    INVALID_EMAIL: "Invalid email",
    INVALID_WEBSITE: "Invalid website",
    INCONSISTENT_PHONE: "Inconsistent phone",
    MISSING_FIELD: "Missing field",
    WHITESPACE_TRIM: "Excess whitespace",
    CASE_NORMALIZATION: "Case normalization",
    DOMAIN_MISMATCH: "Company / domain mismatch",
    INCONSISTENT_DATA: "Inconsistent data",
  };
  return labels[type] ?? type;
}

function severityTone(severity: Severity) {
  if (severity === "CRITICAL" || severity === "HIGH") return "wf-state wf-state--danger";
  if (severity === "MEDIUM") return "wf-state wf-state--warning";
  return "wf-state wf-state--success";
}

export function FindingsTable({
  findings,
  selectedIds,
  onToggleSelect,
  onSelectAllSafe,
  onClearSelection,
  onOpenApplyModal,
  isApplying,
}: FindingsTableProps) {
  const [severityFilter, setSeverityFilter] = React.useState("ALL");
  const [issueTypeFilter, setIssueTypeFilter] = React.useState("ALL");
  const [safeOnly, setSafeOnly] = React.useState(false);
  const [hiddenIds, setHiddenIds] = React.useState<Set<string>>(new Set());

  const visibleFindings = React.useMemo(() => findings.filter((finding) => {
    if (hiddenIds.has(finding.id)) return false;
    if (severityFilter !== "ALL" && finding.severity !== severityFilter) return false;
    if (issueTypeFilter !== "ALL" && finding.issueType !== issueTypeFilter) return false;
    if (safeOnly && !finding.safeToApply) return false;
    return true;
  }), [findings, hiddenIds, severityFilter, issueTypeFilter, safeOnly]);

  const safeCount = findings.filter((finding) => finding.safeToApply && hasProposedValue(finding.proposedValue) && !hiddenIds.has(finding.id)).length;
  const selectableVisible = visibleFindings.filter((finding) => hasProposedValue(finding.proposedValue));
  const allVisibleSelected = selectableVisible.length > 0 && selectableVisible.every((finding) => selectedIds.includes(finding.id));

  function toggleVisibleSelection(checked: boolean) {
    if (checked) {
      selectableVisible.forEach((finding) => {
        if (!selectedIds.includes(finding.id)) onToggleSelect(finding.id);
      });
    } else {
      selectableVisible.forEach((finding) => {
        if (selectedIds.includes(finding.id)) onToggleSelect(finding.id);
      });
    }
  }

  if (findings.length === 0) {
    return <div className="wf-empty"><ShieldCheck size={22} /><strong>No findings returned</strong><p>The scan completed without any findings, or the workflow returned an empty result set.</p></div>;
  }

  return (
    <div className="wf-stack">
      <div className="wf-toolbar">
        <div className="wf-toolbar__group">
          <span className="wf-field-label flex items-center gap-2"><Filter size={15} /> Filter findings</span>
          <label className="wf-field-wrap"><span className="sr-only">Severity filter</span><select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)}><option value="ALL">All severities</option><option value="CRITICAL">Critical</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option></select></label>
          <label className="wf-field-wrap"><span className="sr-only">Issue type filter</span><select value={issueTypeFilter} onChange={(event) => setIssueTypeFilter(event.target.value)}><option value="ALL">All issue types</option><option value="DUPLICATE_CANDIDATE">Duplicate candidate</option><option value="INVALID_EMAIL">Invalid email</option><option value="INVALID_WEBSITE">Invalid website</option><option value="INCONSISTENT_PHONE">Inconsistent phone</option><option value="MISSING_FIELD">Missing field</option><option value="CASE_NORMALIZATION">Case normalization</option><option value="WHITESPACE_TRIM">Whitespace trim</option><option value="DOMAIN_MISMATCH">Domain mismatch</option><option value="INCONSISTENT_DATA">Inconsistent data</option></select></label>
          <label className="wf-choice"><input type="checkbox" checked={safeOnly} onChange={(event) => setSafeOnly(event.target.checked)} /><span className="wf-choice__copy"><strong>Safe to apply only</strong></span></label>
        </div>
        <div className="wf-toolbar__group">
          <button type="button" className="wf-action" onClick={onSelectAllSafe}><ShieldCheck size={15} /> Select safe ({safeCount})</button>
          <button type="button" className="wf-action" onClick={() => toggleVisibleSelection(true)} disabled={selectableVisible.length === 0}>Select visible ({selectableVisible.length})</button>
          {selectedIds.length > 0 && <button type="button" className="wf-action wf-action--quiet" onClick={onClearSelection}>Clear selection</button>}
        </div>
      </div>

      {visibleFindings.length === 0 ? <div className="wf-empty"><EyeOff size={20} /><strong>No rows match these filters</strong><p>Adjust the severity, issue type or safe-to-apply filter to see other findings.</p></div> : <div className="wf-table-wrap"><table className="wf-table" style={{ minWidth: 950 }}><thead><tr><th scope="col"><input aria-label="Select all visible findings" type="checkbox" checked={allVisibleSelected} onChange={(event) => toggleVisibleSelection(event.target.checked)} /></th><th scope="col">Lead record</th><th scope="col">Field and issue</th><th scope="col">Current value</th><th scope="col">Proposed value</th><th scope="col">Confidence and rationale</th><th scope="col">Visibility</th></tr></thead><tbody>{visibleFindings.map((finding) => {
        const selected = selectedIds.includes(finding.id);
        const hasProposal = hasProposedValue(finding.proposedValue);
        return <tr key={finding.id} aria-selected={selected}><td><input type="checkbox" aria-label={`Select finding for ${finding.leadIdentifier || finding.recordId}`} checked={selected} disabled={!hasProposal} onChange={() => onToggleSelect(finding.id)} /></td><td><span className="wf-table__primary block">{finding.leadIdentifier || "Unknown lead"}</span><span className="wf-mono block mt-1">{finding.recordId}</span></td><td><span className="wf-mono block">{finding.fieldName}</span><span className="mt-1 block text-sm">{issueLabel(finding.issueType)}</span><span className={`${severityTone(finding.severity)} mt-1`}>{finding.severity}</span></td><td><span className="wf-subtle block">Current</span><span className="wf-mono block mt-1 break-all">{finding.currentValue === null || finding.currentValue === undefined ? "(empty)" : String(finding.currentValue)}</span></td><td><span className="wf-subtle block">Proposed</span>{hasProposal ? <span className="wf-mono block mt-1 break-all">{String(finding.proposedValue)}</span> : <span className="wf-state wf-state--warning mt-1"><AlertTriangle size={13} /> Manual input required</span>}</td><td><span className="wf-state wf-state--info">{Math.round(Number(finding.confidence) * 100)}% confidence</span><p className="wf-subtle mt-1">{finding.reason}</p><span className={finding.safeToApply ? "wf-state wf-state--success mt-1" : "wf-state wf-state--warning mt-1"}>{finding.safeToApply ? <><ShieldCheck size={13} /> Safe to apply</> : <><ShieldAlert size={13} /> Manual review</>}</span></td><td><button type="button" className="wf-action wf-action--quiet" onClick={() => setHiddenIds((current) => new Set(current).add(finding.id))} aria-label={`Hide ${finding.fieldName} finding from this view`}><EyeOff size={15} /> Hide</button></td></tr>;
      })}</tbody></table></div>}

      {selectedIds.length > 0 && <div className="wf-panel"><div className="wf-panel__body flex flex-wrap items-center justify-between gap-3"><div><p className="wf-panel__title flex items-center gap-2"><Check size={16} /> {selectedIds.length} finding(s) selected</p><p className="wf-panel__hint">Review the selection before sending it to the backend apply endpoint.</p></div><div className="wf-action-row"><button type="button" className="wf-action wf-action--quiet" onClick={onClearSelection}>Clear</button><button type="button" className="wf-action wf-action--primary" onClick={onOpenApplyModal} disabled={isApplying}>{isApplying ? "Applying…" : "Review and apply"}</button></div></div></div>}
      <p className="wf-subtle">Hidden rows are removed from this view only; no backend data is changed. Proposed values may be selected only when the value is not null.</p>
    </div>
  );
}
