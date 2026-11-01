"use client";
/* Hallmark · v2.0.0 · redesign: component · scope: app · signature: explicit destructive-action review */

import * as React from "react";
import { AlertTriangle, CheckCircle2, Loader2, Lock, X } from "lucide-react";
import type { DataCleaningFinding } from "@/types/data-cleaning";

interface ApplyConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedFindings: DataCleaningFinding[];
  isApplying: boolean;
}

export function ApplyConfirmationModal({ isOpen, onClose, onConfirm, selectedFindings, isApplying }: ApplyConfirmationModalProps) {
  React.useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isApplying) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, isApplying, onClose]);

  if (!isOpen) return null;
  const totalCount = selectedFindings.length;
  const safeCount = selectedFindings.filter((finding) => finding.safeToApply).length;
  const manualCount = totalCount - safeCount;
  const fieldCounts = selectedFindings.reduce<Record<string, number>>((counts, finding) => {
    counts[finding.fieldName] = (counts[finding.fieldName] ?? 0) + 1;
    return counts;
  }, {});

  return (
    <div className="wf-dialog-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget && !isApplying) onClose(); }}>
      <section className="wf-dialog" role="dialog" aria-modal="true" aria-labelledby="wf08-confirm-title" aria-describedby="wf08-confirm-description">
        <header className="wf-panel__head">
          <div><h2 id="wf08-confirm-title" className="wf-panel__title flex items-center gap-2"><Lock size={16} /> Review database changes</h2><p id="wf08-confirm-description" className="wf-panel__hint">Confirm the selected corrections before the backend apply request.</p></div>
          <button type="button" className="wf-action wf-action--quiet" aria-label="Close confirmation" onClick={onClose} disabled={isApplying}><X size={16} /></button>
        </header>
        <div className="wf-dialog__body wf-stack">
          <div className="wf-stat-row"><div className="wf-stat"><p className="wf-stat__label">Selected</p><p className="wf-stat__value">{totalCount}</p></div><div className="wf-stat"><p className="wf-stat__label">Marked safe</p><p className="wf-stat__value">{safeCount}</p></div><div className="wf-stat"><p className="wf-stat__label">Needs review</p><p className="wf-stat__value">{manualCount}</p></div></div>
          <section className="wf-result-block"><h3 className="wf-result-heading">Affected fields</h3><ul className="wf-list mt-2">{Object.entries(fieldCounts).map(([field, count]) => <li key={field} className="wf-list__item"><span className="wf-mono">{field}</span><strong className="tabular-nums">{count}</strong></li>)}</ul></section>
          {manualCount > 0 && <div className="wf-callout wf-callout--warning"><AlertTriangle size={16} /><p><strong>Manual review selected.</strong> {manualCount} selected finding(s) are not marked safe to apply. Verify each proposed value before continuing.</p></div>}
          <div className="wf-callout wf-callout--info"><Lock size={16} /><p><strong>Backend validation remains authoritative.</strong> The API validates accepted finding IDs, applies eligible changes within its database transaction and records the audit result. Duplicate candidates are not auto-merged.</p></div>
          <div className="wf-action-row"><button type="button" className="wf-action" onClick={onClose} disabled={isApplying}>Cancel</button><button type="button" className="wf-action wf-action--primary" onClick={onConfirm} disabled={isApplying || totalCount === 0}>{isApplying ? <><Loader2 size={15} className="animate-spin" /> Applying</> : <><CheckCircle2 size={15} /> Apply</>}</button></div>
        </div>
      </section>
    </div>
  );
}
