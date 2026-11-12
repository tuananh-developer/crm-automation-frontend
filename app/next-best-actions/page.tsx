"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowUpRight, BrainCircuit, FileSearch, ShieldCheck } from "lucide-react";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { leadService } from "@/services/lead.service";
import { getCustomers } from "@/services/customer.service";
import { getApiErrorMessage } from "@/services/api-client";
import { createIdempotencyKey, t12WorkflowService } from "@/services/t12-workflow.service";
import type { NextBestActionRecommendation } from "@/types/t12-workflows";
import styles from "@/components/workspace/workspace.module.css";

const actionNames: Record<string, string> = {
  REVIEW_LEAD_PROFILE: "Review profile completeness",
  SCHEDULE_DISCOVERY_CALL: "Recommend a discovery call",
  PREPARE_FOLLOW_UP: "Prepare a follow-up",
  REQUEST_HUMAN_REVIEW: "Request human review",
  REVIEW_ACCOUNT_CONTEXT: "Review account context",
};

export default function NextBestActionsPage() {
  const [entityType, setEntityType] = useState<"Lead" | "Customer">("Lead");
  const [entityId, setEntityId] = useState("");
  const [acceptedRun, setAcceptedRun] = useState<{ workflowRunId: string; status: string } | null>(null);
  const [recommendationInput, setRecommendationInput] = useState("");
  const [lookupId, setLookupId] = useState("");
  const leadsQuery = useQuery({
    queryKey: ["leads", "next-best-action"],
    queryFn: () => leadService.getLeads({ limit: 100, page: 1 }),
    enabled: entityType === "Lead",
  });
  const customersQuery = useQuery({
    queryKey: ["customers", "next-best-action"],
    queryFn: () => getCustomers({ limit: 100, page: 1 }),
    enabled: entityType === "Customer",
  });
  const recommendationQuery = useQuery({
    queryKey: ["next-best-action-recommendation", lookupId],
    queryFn: () => t12WorkflowService.getNextBestAction(lookupId),
    enabled: Boolean(lookupId),
    retry: false,
  });

  const entityOptions = useMemo(() => {
    if (entityType === "Lead") {
      return (leadsQuery.data?.data ?? []).map((lead) => ({
        id: lead.id,
        label: `${[lead.firstName, lead.lastName].filter(Boolean).join(" ")} / ${lead.companyName || lead.email}`,
      }));
    }
    return (customersQuery.data?.data ?? []).map((customer) => ({
      id: customer.id,
      label: `${customer.name} / ${customer.companyName || customer.email}`,
    }));
  }, [entityType, leadsQuery.data?.data, customersQuery.data?.data]);

  const requestMutation = useMutation({
    mutationFn: () =>
      t12WorkflowService.requestNextBestAction(
        { entityType, entityId },
        createIdempotencyKey(),
      ),
    onSuccess: (result) => {
      setAcceptedRun({ workflowRunId: result.workflowRunId, status: result.status });
    },
  });

  const recommendation = recommendationQuery.data as NextBestActionRecommendation | undefined;

  const submitRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!entityId) return;
    requestMutation.mutate();
  };

  const submitLookup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLookupId(recommendationInput.trim());
  };

  return (
    <>
      <WorkspaceHeader />
      <main id="main-content" tabIndex={-1} className={styles.screen}>
        <header className={styles.screenHead}>
          <div className={styles.screenHeadCopy}>
            <h1 className={styles.screenTitle}>Find the next best action.</h1>
            <p className={styles.screenDescription}>
              Review recommendations against CRM evidence. Keep every consequential action under human control.
            </p>
          </div>
          <div className={styles.headMetric}>
            <span className={styles.meta}>Control model</span>
            <strong>Human</strong>
            <span>approval remains explicit</span>
          </div>
        </header>

        <div className={styles.twoColumn}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Request an analysis</h2>
                <p className={styles.panelHint}>A request is scoped to exactly one record.</p>
              </div>
              <BrainCircuit size={20} />
            </div>
            <form className={styles.panelBody} onSubmit={submitRequest}>
              <div className={styles.fieldStack}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Record type</span>
                  <select
                    className={styles.selectInput}
                    value={entityType}
                    onChange={(event) => {
                      setEntityType(event.target.value as "Lead" | "Customer");
                      setEntityId("");
                      setAcceptedRun(null);
                    }}
                  >
                    <option value="Lead">Lead</option>
                    <option value="Customer">Customer</option>
                  </select>
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Record</span>
                  <select
                    className={styles.selectInput}
                    value={entityId}
                    onChange={(event) => setEntityId(event.target.value)}
                    required
                  >
                    <option value="">Choose a {entityType.toLowerCase()}</option>
                    {entityOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                  <span className={styles.fieldHelp}>
                    {entityType === "Lead" ? "Only records visible to your account are returned." : "Only customers in your access scope are returned."}
                  </span>
                </label>
                <button className={styles.primaryButton} type="submit" disabled={!entityId || requestMutation.isPending}>
                  <BrainCircuit size={16} />
                  {requestMutation.isPending ? "Submitting request…" : "Request next best actions"}
                </button>
              </div>
            </form>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Workflow receipt</h2>
                <p className={styles.panelHint}>The request ID is returned by the backend immediately.</p>
              </div>
              <span className={styles.status}>202 Accepted</span>
            </div>
            <div className={styles.panelBody}>
              {requestMutation.isError && (
                <div className={styles.errorPanel} role="alert">{getApiErrorMessage(requestMutation.error)}</div>
              )}
              {acceptedRun ? (
                <div className={styles.fieldStack}>
                  <div className={styles.successPanel}>
                    <ShieldCheck size={17} />
                    <span>The analysis request has been accepted. No recommendation is treated as approved by this step.</span>
                  </div>
                  <div>
                    <span className={styles.meta}>Workflow run ID</span>
                    <p className={styles.codeText}>{acceptedRun.workflowRunId}</p>
                  </div>
                  <div>
                    <span className={styles.meta}>Current status</span>
                    <p className={styles.rowTitle}>{acceptedRun.status.toLowerCase().replaceAll("_", " ")}</p>
                  </div>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <FileSearch size={22} />
                  <strong>No analysis requested in this session</strong>
                  <p>Select a record and start WF10. The backend will create the workflow run and dispatch it to n8n.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <section className={styles.panel} style={{ marginTop: "1.2rem" }}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Open a recommendation</h2>
              <p className={styles.panelHint}>The backend exposes a recommendation read endpoint by recommendation ID.</p>
            </div>
          </div>
          <div className={styles.panelBody}>
            <form className={styles.lookupForm} onSubmit={submitLookup}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Recommendation ID</span>
                <input
                  className={styles.textInput}
                  value={recommendationInput}
                  onChange={(event) => setRecommendationInput(event.target.value)}
                  placeholder="Paste a recommendation UUID"
                  required
                />
              </label>
              <button type="submit" className={styles.secondaryButton} disabled={!recommendationInput.trim() || recommendationQuery.isFetching}>
                <FileSearch size={15} /> Load recommendation
              </button>
            </form>
            {recommendationQuery.isFetching && <p className={styles.loadingState}>Loading recommendation…</p>}
            {recommendationQuery.isError && <div className={styles.errorPanel} role="alert">{getApiErrorMessage(recommendationQuery.error)}</div>}
            {recommendation && (
              <div className={styles.recommendationResult}>
                <div className={styles.resultTopline}>
                  <div>
                    <span className={styles.meta}>Recommendation / {recommendation.entityType}</span>
                    <h3 className={styles.sectionTitle}>{recommendation.status.toLowerCase().replaceAll("_", " ")}</h3>
                  </div>
                  <span className={recommendation.requiresHumanApproval ? styles.statusAmber : styles.statusGreen}>
                    {recommendation.requiresHumanApproval ? "Human approval required" : "No approval gate"}
                  </span>
                </div>
                {recommendation.recommendations.map((item) => (
                  <article className={styles.recommendationCard} key={item.actionCode}>
                    <div className={styles.recommendationHeader}>
                      <div>
                        <span className={styles.meta}>Rank {item.rank}</span>
                        <h4 className={styles.rowTitle}>{actionNames[item.actionCode] ?? item.actionCode.replaceAll("_", " ").toLowerCase()}</h4>
                      </div>
                      <span className={styles.statusBlue}>{Math.round(item.confidence * 100)}% confidence</span>
                    </div>
                    <p className={styles.recommendationExplain}>{item.explanation}</p>
                    <div className={styles.recommendationEvidence}>
                      {item.requiresApproval && <span className={styles.statusAmber}>Approval gate</span>}
                      {item.evidenceIds.map((id) => <span className={styles.evidenceToken} key={id}>{id}</span>)}
                      {item.evidenceIds.length === 0 && <span className={styles.fieldHelp}>No evidence IDs returned.</span>}
                    </div>
                  </article>
                ))}
                <p className={styles.meta}>Run {recommendation.workflowRunId} / {new Date(recommendation.createdAt).toLocaleString()}</p>
              </div>
            )}
          </div>
        </section>

        <div className={styles.infoPanel} style={{ marginTop: "1.2rem" }}>
          <ArrowUpRight size={17} />
          <span>
            Integration note: this backend currently accepts WF10 requests and reads recommendations by recommendation ID, but it does not expose a browser endpoint that resolves a workflowRunId to its recommendationId. The receipt above is therefore honest about the accepted run; use the lookup when a recommendation ID is available. The UI does not call machine-authenticated n8n endpoints.
          </span>
        </div>
      </main>
    </>
  );
}
