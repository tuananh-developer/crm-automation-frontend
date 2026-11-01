"use client";
/* Hallmark · v2.0.0 · redesign: component · scope: app · signature: scan scope selector */

import * as React from "react";
import { Filter, Layers, Play } from "lucide-react";
import type { CreateScanRequest } from "@/types/data-cleaning";

interface ScopeSelectorProps {
  onStartScan: (req: CreateScanRequest) => void;
  isLoading: boolean;
}

export function ScopeSelector({ onStartScan, isLoading }: ScopeSelectorProps) {
  const [scope, setScope] = React.useState<"ALL" | "FILTER">("ALL");
  const [status, setStatus] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [limit, setLimit] = React.useState(100);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const req: CreateScanRequest = {
      scope,
      filter: scope === "FILTER" ? {
        status: status || undefined,
        search: search.trim() || undefined,
        limit: Math.min(2000, Math.max(10, Number(limit) || 100)),
      } : undefined,
    };
    onStartScan(req);
  }

  return (
    <section className="wf-panel" aria-labelledby="wf08-scope-title">
      <div className="wf-panel__head">
        <div><h2 id="wf08-scope-title" className="wf-panel__title">Scan scope</h2><p className="wf-panel__hint">Choose which lead records the backend should inspect.</p></div>
        <Filter size={17} color="var(--wf-accent)" aria-hidden="true" />
      </div>
      <div className="wf-panel__body">
        <form className="wf-stack" onSubmit={handleSubmit}>
          <fieldset className="wf-stack">
            <legend className="wf-field-label">Target dataset</legend>
            <div className="wf-choice-list sm:grid sm:grid-cols-2">
              <label className="wf-choice">
                <input type="radio" name="wf08-scope" value="ALL" checked={scope === "ALL"} onChange={() => setScope("ALL")} />
                <span className="wf-choice__copy"><strong className="flex items-center gap-2"><Layers size={15} /> All active leads</strong><small>Run the quality scan against the active lead dataset.</small></span>
              </label>
              <label className="wf-choice">
                <input type="radio" name="wf08-scope" value="FILTER" checked={scope === "FILTER"} onChange={() => setScope("FILTER")} />
                <span className="wf-choice__copy"><strong className="flex items-center gap-2"><Filter size={15} /> Filtered batch</strong><small>Limit the scan to a pipeline status or matching search term.</small></span>
              </label>
            </div>
          </fieldset>

          {scope === "FILTER" && <div className="wf-well wf-fields">
            <label className="wf-field-wrap"><span className="wf-field-label">Lead status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option value="NEW">New</option><option value="QUALIFYING">Qualifying</option><option value="QUALIFIED">Qualified</option><option value="CONTACTED">Contacted</option><option value="LOST">Lost</option></select></label>
            <label className="wf-field-wrap"><span className="wf-field-label">Search keyword</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email or company" /></label>
            <label className="wf-field-wrap"><span className="wf-field-label">Maximum batch size</span><input type="number" min={10} max={2000} step={1} value={limit} onChange={(event) => setLimit(Number(event.target.value))} /><span className="wf-field-help">Accepted range: from 10 to 2,000 records.</span></label>
          </div>}

          <div className="wf-action-row"><button type="submit" className="wf-action wf-action--primary" disabled={isLoading}><Play size={15} />{isLoading ? "Starting scan…" : "Start data quality scan"}</button></div>
        </form>
      </div>
    </section>
  );
}
