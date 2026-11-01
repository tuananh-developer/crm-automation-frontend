/* Hallmark · v2.0.0 · redesign: component · scope: app · signature: apply execution receipt */

import { AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import type { ApplyCleaningResponse } from "@/types/data-cleaning";

interface ApplySummaryCardProps {
  response: ApplyCleaningResponse;
  onDismiss: () => void;
}

export function ApplySummaryCard({ response, onDismiss }: ApplySummaryCardProps) {
  return (
    <section className="wf-panel" aria-labelledby="wf08-apply-result-title">
      <div className="wf-panel__head">
        <div><h2 id="wf08-apply-result-title" className="wf-panel__title flex items-center gap-2"><ShieldCheck size={16} /> Apply execution result</h2><p className="wf-panel__hint">The backend response for this apply request.</p></div>
        <button type="button" className="wf-action wf-action--quiet" onClick={onDismiss}>Dismiss</button>
      </div>
      <div className="wf-panel__body wf-stack">
        <div className="wf-stat-row">
          <div className="wf-stat"><p className="wf-stat__label">Applied</p><p className="wf-stat__value">{response.appliedCount}</p></div>
          <div className="wf-stat"><p className="wf-stat__label">Skipped</p><p className="wf-stat__value">{response.skippedCount}</p></div>
          <div className="wf-stat"><p className="wf-stat__label">Requested</p><p className="wf-stat__value">{response.totalRequested}</p></div>
        </div>
        {response.results.length > 0 ? <div className="wf-table-wrap"><table className="wf-table" style={{ minWidth: 760 }}><thead><tr><th scope="col">Result</th><th scope="col">Field</th><th scope="col">Previous value</th><th scope="col">Applied value</th><th scope="col">Details</th></tr></thead><tbody>{response.results.map((item) => <tr key={item.findingId}><td><span className={item.status === "APPLIED" ? "wf-state wf-state--success" : "wf-state wf-state--warning"}>{item.status === "APPLIED" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}{item.status}</span></td><td><span className="wf-mono">{item.fieldName || "—"}</span></td><td><span className="wf-mono break-all">{item.oldValue === null || item.oldValue === undefined ? "—" : String(item.oldValue)}</span></td><td><span className="wf-mono break-all">{item.newValue === null || item.newValue === undefined ? "—" : String(item.newValue)}</span></td><td>{item.skipReason || (item.status === "APPLIED" ? "Applied by backend" : "No reason returned")}</td></tr>)}</tbody></table></div> : <div className="wf-empty"><strong>No per-finding results returned</strong><p>The backend returned summary counts without individual result rows.</p></div>}
        <p className="wf-mono">WorkflowRun: {response.workflowRunId}</p>
      </div>
    </section>
  );
}
