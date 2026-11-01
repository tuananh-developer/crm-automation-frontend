"use client";
/* Hallmark · v2.0.0 · redesign: full · scope: app · genre: modern-minimal · theme: Cobalt · signature: actionable recommendation register */

import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  LoaderCircle,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { WorkflowPageHeading } from "@/components/workflows/WorkflowChrome";
import { getCustomers } from "@/services/customer.service";
import { getApiErrorMessage } from "@/services/api-client";
import { leadService } from "@/services/lead.service";
import { t12WorkflowService } from "@/services/t12-workflows.service";
import type { T12EntityType } from "@/types/t12-workflows";

function newIdempotencyKey() {
  return globalThis.crypto?.randomUUID?.() ?? `wf10-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function percent(value: number) {
  return `${Math.round(Math.max(0, Math.min(1, Number(value) || 0)) * 100)}%`;
}

export default function NextBestActionPage() {
  const [entityType, setEntityType] = React.useState<T12EntityType>("Lead");
  const [entityId, setEntityId] = React.useState("");
  const [workflowRunId, setWorkflowRunId] = React.useState<string | null>(null);
  const [recommendationLookup, setRecommendationLookup] = React.useState("");
  const [activeRecommendationId, setActiveRecommendationId] = React.useState<string | null>(null);

  const leadsQuery = useQuery({
    queryKey: ["wf10-leads"],
    queryFn: () => leadService.getLeads({ page: 1, limit: 100 }),
    enabled: entityType === "Lead",
  });
  const customersQuery = useQuery({
    queryKey: ["wf10-customers"],
    queryFn: () => getCustomers({ page: 1, limit: 100 }),
    enabled: entityType === "Customer",
  });

  const requestMutation = useMutation({
    mutationFn: () => t12WorkflowService.requestNextBestAction({ entityType, entityId }, newIdempotencyKey()),
    onSuccess: (result) => {
      setWorkflowRunId(result.workflowRunId);
      setActiveRecommendationId(null);
    },
  });

  const recommendationQuery = useQuery({
    queryKey: ["wf10-recommendation", activeRecommendationId],
    queryFn: () => t12WorkflowService.getNextBestAction(activeRecommendationId!),
    enabled: Boolean(activeRecommendationId),
    retry: false,
  });

  const leads = leadsQuery.data?.data ?? [];
  const customers = customersQuery.data?.data ?? [];
  const isListLoading = entityType === "Lead" ? leadsQuery.isLoading : customersQuery.isLoading;
  const listError = entityType === "Lead" ? leadsQuery.error : customersQuery.error;
  const hasRecords = entityType === "Lead" ? leads.length > 0 : customers.length > 0;

  function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (entityId && !requestMutation.isPending) requestMutation.mutate();
  }

  function loadRecommendation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = recommendationLookup.trim();
    if (id) setActiveRecommendationId(id);
  }

  const recommendation = recommendationQuery.data;

  return (
    <div className="wf-screen">
      <WorkflowPageHeading
        code="WF10 · T12"
        title="Next Best Action"
        description="Request ranked actions for a Lead or Customer. Recommendations remain advisory until an authorized user completes the required review."
      />

      {(requestMutation.error || recommendationQuery.error) && (
        <div role="alert" className="wf-callout wf-callout--danger">
          <AlertCircle size={16} aria-hidden="true" />
          <p>{getApiErrorMessage(requestMutation.error || recommendationQuery.error)}</p>
        </div>
      )}

      <div className="wf-work-grid">
        <section className="wf-panel" aria-labelledby="wf10-request-title">
          <div className="wf-panel__head">
            <div>
              <h2 id="wf10-request-title" className="wf-panel__title">Request an analysis</h2>
              <p className="wf-panel__hint">Choose one CRM record that you are allowed to access.</p>
            </div>
            <Sparkles size={17} color="var(--wf-accent)" aria-hidden="true" />
          </div>
          <div className="wf-panel__body">
            <form className="wf-stack" onSubmit={submitRequest}>
              <div className="wf-fields">
                <label className="wf-field-wrap">
                  <span className="wf-field-label">Record type</span>
                  <select value={entityType} onChange={(event) => { setEntityType(event.target.value as T12EntityType); setEntityId(""); }}>
                    <option value="Lead">Lead</option>
                    <option value="Customer">Customer</option>
                  </select>
                </label>
                <label className="wf-field-wrap">
                  <span className="wf-field-label">CRM record</span>
                  <select required value={entityId} onChange={(event) => setEntityId(event.target.value)} disabled={isListLoading || Boolean(listError)}>
                    <option value="">Select a {entityType.toLowerCase()}</option>
                    {entityType === "Lead" && leads.map((lead) => (
                      <option key={lead.id} value={lead.id}>{lead.firstName} {lead.lastName} | {lead.companyName}</option>
                    ))}
                    {entityType === "Customer" && customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>{customer.name} | {customer.companyName || customer.email}</option>
                    ))}
                  </select>
                  {isListLoading && <span className="wf-field-help">Loading accessible records…</span>}
                  {listError && <span className="wf-field-help" role="alert">{getApiErrorMessage(listError)}</span>}
                  {!isListLoading && !listError && !hasRecords && <span className="wf-field-help">No accessible records were returned for this account.</span>}
                </label>
              </div>
              <p className="wf-field-help">The selector requests the first 100 visible records. Backend ownership checks remain authoritative.</p>
              <div className="wf-action-row">
                <button className="wf-action wf-action--primary" type="submit" disabled={!entityId || isListLoading || requestMutation.isPending}>
                  {requestMutation.isPending ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {requestMutation.isPending ? "Submitting request" : "Generate recommendations"}
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="wf-panel" aria-labelledby="wf10-status-title">
          <div className="wf-panel__head">
            <div>
              <h2 id="wf10-status-title" className="wf-panel__title">Request status</h2>
              <p className="wf-panel__hint">The API acknowledges a WorkflowRun; it does not return a recommendation ID.</p>
            </div>
            <ShieldCheck size={17} color="var(--wf-accent)" aria-hidden="true" />
          </div>
          <div className="wf-panel__body wf-stack">
            {workflowRunId ? (
              <>
                <div className="wf-status wf-status--success"><CheckCircle2 size={16} /> Request accepted by the backend</div>
                <div className="wf-well">
                  <p className="wf-field-label">Workflow run ID</p>
                  <p className="wf-mono mt-2">{workflowRunId}</p>
                  <button type="button" className="wf-inline-link mt-3" onClick={() => void navigator.clipboard?.writeText(workflowRunId)}>Copy workflow run ID</button>
                </div>
                <p className="wf-subtle">n8n is processing the request. The frontend cannot resolve the final recommendation automatically until the backend exposes a lookup by WorkflowRun ID.</p>
              </>
            ) : (
              <div className="wf-empty">
                <ClipboardList size={22} aria-hidden="true" />
                <strong>No request in this session</strong>
                <p>Submit a Lead or Customer to create a new analysis request.</p>
              </div>
            )}
            <div className="wf-callout wf-callout--warning">
              <AlertCircle size={15} aria-hidden="true" />
              <p><strong>API contract gap.</strong> The available read route requires `recommendationId`; no user-facing read route accepts `workflowRunId` yet.</p>
            </div>
          </div>
        </section>
      </div>

      <section className="wf-panel" aria-labelledby="wf10-result-title">
        <div className="wf-panel__head">
          <div>
            <h2 id="wf10-result-title" className="wf-panel__title">Load a completed recommendation</h2>
            <p className="wf-panel__hint">Use a recommendation UUID returned through an authorized result channel.</p>
          </div>
        </div>
        <div className="wf-panel__body wf-stack">
          <form className="flex flex-col gap-2 sm:flex-row" onSubmit={loadRecommendation}>
            <label className="sr-only" htmlFor="wf10-recommendation-id">Recommendation ID</label>
            <input id="wf10-recommendation-id" value={recommendationLookup} onChange={(event) => setRecommendationLookup(event.target.value)} placeholder="Recommendation UUID" autoComplete="off" />
            <button className="wf-action" type="submit" disabled={!recommendationLookup.trim() || recommendationQuery.isFetching}>
              {recommendationQuery.isFetching ? <LoaderCircle size={16} className="animate-spin" /> : <Search size={16} />}
              Load result
            </button>
            {activeRecommendationId && <button className="wf-action wf-action--quiet" type="button" onClick={() => { setActiveRecommendationId(null); setRecommendationLookup(""); }}>Clear</button>}
          </form>

          {recommendationQuery.isLoading && <div className="wf-loading"><LoaderCircle size={17} className="animate-spin" /> Loading recommendation…</div>}
          {recommendationQuery.isError && <p role="alert" className="wf-subtle">Could not load this recommendation. Confirm the UUID and your access rights, then try again.</p>}
          {recommendation && (
            <div className="wf-stack">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="wf-result-heading">Recommendation set</h3>
                  <p className="wf-subtle mt-1">{recommendation.entityType} · <span className="wf-mono">{recommendation.entityId}</span></p>
                </div>
                <span className="wf-status"><CheckCircle2 size={15} /> {recommendation.status}</span>
              </div>
              <div className="wf-table-wrap">
                <table className="wf-table" style={{ minWidth: 680 }}>
                  <thead><tr><th scope="col">Rank</th><th scope="col">Action</th><th scope="col">Confidence</th><th scope="col">Approval</th><th scope="col">Evidence</th></tr></thead>
                  <tbody>
                    {recommendation.recommendations.map((item) => (
                      <tr key={`${item.rank}-${item.actionCode}`}>
                        <td className="wf-mono">{item.rank}</td>
                        <td><span className="wf-table__primary">{item.actionCode}</span><p className="wf-subtle mt-1">{item.explanation}</p></td>
                        <td className="wf-mono">{percent(item.confidence)}</td>
                        <td><span className={item.requiresApproval ? "wf-state wf-state--warning" : "wf-state wf-state--success"}>{item.requiresApproval ? "Approval required" : "No approval flag"}</span></td>
                        <td>{item.evidenceIds.length} references{item.evidenceIds.length > 0 && <details className="mt-1"><summary className="wf-inline-link">View IDs</summary><ul className="mt-2 space-y-1">{item.evidenceIds.map((id) => <li key={id} className="wf-mono">{id}</li>)}</ul></details>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {recommendation.reviewTaskId && <Link className="wf-inline-link inline-flex items-center gap-1" href="/review">Open review task <ArrowUpRight size={14} /></Link>}
            </div>
          )}
          {!activeRecommendationId && !recommendation && <p className="wf-subtle">No recommendation loaded yet.</p>}
        </div>
      </section>
    </div>
  );
}
