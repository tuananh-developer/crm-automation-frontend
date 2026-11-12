"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, Scale, ShieldCheck } from "lucide-react";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { useAuth } from "@/components/providers/AuthProvider";
import { leadService } from "@/services/lead.service";
import { getCustomers } from "@/services/customer.service";
import { getApiErrorMessage } from "@/services/api-client";
import { createIdempotencyKey, t12WorkflowService } from "@/services/t12-workflow.service";
import type { CatalogItem } from "@/types/t12-workflows";
import styles from "@/components/workspace/workspace.module.css";

function money(value: string | number, currency: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `${value} ${currency}`;
  try {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toLocaleString("vi-VN")} ${currency}`;
  }
}

function quoteStatusClass(status: string) {
  if (status === "APPROVED") return styles.statusGreen;
  if (status === "REJECTED") return styles.statusRed;
  if (status === "PENDING_APPROVAL") return styles.statusAmber;
  return styles.statusBlue;
}

export default function QuotesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [entityType, setEntityType] = useState<"Lead" | "Customer">("Lead");
  const [entityId, setEntityId] = useState("");
  const [requirements, setRequirements] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [decisionComment, setDecisionComment] = useState("");

  const leadsQuery = useQuery({
    queryKey: ["leads", "quote-request"],
    queryFn: () => leadService.getLeads({ limit: 100, page: 1 }),
    enabled: entityType === "Lead",
  });
  const customersQuery = useQuery({
    queryKey: ["customers", "quote-request"],
    queryFn: () => getCustomers({ limit: 100, page: 1 }),
    enabled: entityType === "Customer",
  });
  const catalogQuery = useQuery({
    queryKey: ["catalog-items"],
    queryFn: t12WorkflowService.getCatalog,
  });
  const quotesQuery = useQuery({
    queryKey: ["quotes"],
    queryFn: t12WorkflowService.getQuotes,
    refetchInterval: activeRunId ? 2500 : false,
  });

  const selectedCatalog = useMemo(
    () => (catalogQuery.data ?? []).filter((item) => (quantities[item.id] ?? 0) > 0),
    [catalogQuery.data, quantities],
  );
  const selectedCurrency = selectedCatalog[0]?.currency ?? "VND";
  const visibleQuotes = quotesQuery.data ?? [];
  const activeQuote = activeRunId
    ? visibleQuotes.find((quote) => quote.workflowRunId === activeRunId) ?? null
    : null;

  useEffect(() => {
    if (activeQuote) {
      setSelectedQuoteId(activeQuote.id);
      setActiveRunId(null);
    }
  }, [activeQuote]);

  const detailQuery = useQuery({
    queryKey: ["quote", selectedQuoteId],
    queryFn: () => t12WorkflowService.getQuote(selectedQuoteId!),
    enabled: Boolean(selectedQuoteId),
  });

  const entityOptions = useMemo(() => {
    if (entityType === "Lead") {
      return (leadsQuery.data?.data ?? []).map((lead) => ({
        id: lead.id,
        label: `${[lead.firstName, lead.lastName].filter(Boolean).join(" ")} · ${lead.companyName || lead.email}`,
      }));
    }
    return (customersQuery.data?.data ?? []).map((customer) => ({
      id: customer.id,
      label: `${customer.name} · ${customer.companyName || customer.email}`,
    }));
  }, [entityType, leadsQuery.data?.data, customersQuery.data?.data]);

  const requestMutation = useMutation({
    mutationFn: () =>
      t12WorkflowService.requestQuoteDraft(
        {
          ...(entityType === "Lead" ? { leadId: entityId } : { customerId: entityId }),
          requestedItems: selectedCatalog.map((item) => ({
            catalogItemId: item.id,
            quantity: quantities[item.id],
          })),
          requirements: requirements.trim() || undefined,
          currency: selectedCurrency,
        },
        createIdempotencyKey(),
      ),
    onSuccess: (response) => {
      setActiveRunId(response.workflowRunId);
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
  });

  const decisionMutation = useMutation({
    mutationFn: ({ decision }: { decision: "approve" | "reject" }) =>
      t12WorkflowService.decideQuote(selectedQuoteId!, decision, { comment: decisionComment.trim() || undefined }),
    onSuccess: () => {
      setDecisionComment("");
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["quote", selectedQuoteId] });
    },
  });

  const updateQuantity = (item: CatalogItem, raw: string) => {
    const quantity = Math.max(0, Math.min(10000, Number.parseInt(raw || "0", 10) || 0));
    setQuantities((current) => {
      const next = { ...current };
      if (quantity === 0) delete next[item.id];
      else next[item.id] = quantity;
      return next;
    });
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!entityId || selectedCatalog.length === 0) return;
    requestMutation.mutate();
  };

  const detail = detailQuery.data;
  const isAdmin = user?.role === "ADMIN";

  return (
    <>
      <WorkspaceHeader />
      <main className={styles.screen}>
        <header className={styles.screenHead}>
          <div className={styles.screenHeadCopy}>
            <div className={styles.kicker}>T12 · WF12 / Commercial workflow</div>
            <h1 className={styles.screenTitle}>Shape the proposal.</h1>
            <p className={styles.screenDescription}>
              Select catalog items and quantities, add the commercial context, and let the backend calculate the quote. AI drafts the proposal; Admin approval remains a separate decision.
            </p>
          </div>
          <div className={styles.headMetric}>
            <span className={styles.meta}>PRICING AUTHORITY</span>
            <strong>API</strong>
            <span>backend-calculated</span>
          </div>
        </header>

        <div className={styles.twoColumn}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Start a quote draft</h2>
                <p className={styles.panelHint}>One Lead or Customer and at least one active catalog item.</p>
              </div>
              <Plus size={19} />
            </div>
            <form className={styles.panelBody} onSubmit={submit}>
              <div className={styles.fieldStack}>
                <div className={styles.segmentControl} role="group" aria-label="Quote target type">
                  <button type="button" className={entityType === "Lead" ? styles.segmentActive : styles.segment} onClick={() => { setEntityType("Lead"); setEntityId(""); }}>Lead</button>
                  <button type="button" className={entityType === "Customer" ? styles.segmentActive : styles.segment} onClick={() => { setEntityType("Customer"); setEntityId(""); }}>Customer</button>
                </div>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>{entityType} record</span>
                  <select className={styles.selectInput} value={entityId} onChange={(event) => setEntityId(event.target.value)} required>
                    <option value="">Choose a {entityType.toLowerCase()}</option>
                    {entityOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                </label>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Catalog selection</span>
                  {catalogQuery.isLoading ? (
                    <p className={styles.loadingState}>Loading active catalog items…</p>
                  ) : catalogQuery.isError ? (
                    <div className={styles.errorPanel} role="alert">{getApiErrorMessage(catalogQuery.error)}</div>
                  ) : (catalogQuery.data ?? []).length === 0 ? (
                    <p className={styles.fieldHelp}>No active catalog items are available.</p>
                  ) : (
                    <div className={styles.catalogList}>
                      {(catalogQuery.data ?? []).map((item) => {
                        const quantity = quantities[item.id] ?? 0;
                        const differentCurrency = selectedCatalog.length > 0 && item.currency !== selectedCurrency && quantity === 0;
                        return (
                          <div className={quantity > 0 ? styles.catalogRowActive : styles.catalogRow} key={item.id}>
                            <label className={styles.catalogCheck}>
                              <input type="checkbox" checked={quantity > 0} disabled={differentCurrency} onChange={() => updateQuantity(item, quantity > 0 ? "0" : "1")} />
                              <span>
                                <strong>{item.name}</strong>
                                <small>{item.sku} · {item.currency}</small>
                              </span>
                            </label>
                            <div className={styles.catalogPrice}>
                              <strong>{money(item.unitPrice, item.currency)}</strong>
                              <label className={styles.quantityField}>
                                <span>Qty</span>
                                <input type="number" min={0} max={10000} step={1} value={quantity || ""} placeholder="0" onChange={(event) => updateQuantity(item, event.target.value)} disabled={differentCurrency} />
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <span className={styles.fieldHelp}>All selected items must use the same currency. The backend calculates subtotal, tax, discount, and total.</span>
                </div>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Proposal requirements</span>
                  <textarea className={styles.textArea} value={requirements} onChange={(event) => setRequirements(event.target.value)} maxLength={10000} placeholder="Describe the customer context, solution scope, constraints, or outcomes the proposal should address." />
                  <span className={styles.fieldHelp}>{requirements.length.toLocaleString()} / 10,000 characters</span>
                </label>
                {activeRunId && (
                  <div className={styles.infoPanel}>
                    <Scale size={17} />
                    <span>Waiting for the workflow to persist a quote for run <code className={styles.codeText}>{activeRunId}</code>. This page checks the quote list automatically.</span>
                    <button type="button" className={styles.inlineAction} onClick={() => setActiveRunId(null)}>Stop watching</button>
                  </div>
                )}
                <button className={styles.primaryButton} type="submit" disabled={!entityId || selectedCatalog.length === 0 || requestMutation.isPending || Boolean(activeRunId)}>
                  <FileText size={16} /> {requestMutation.isPending ? "Requesting draft…" : "Generate proposal draft"}
                </button>
                {requestMutation.isError && <div className={styles.errorPanel} role="alert">{getApiErrorMessage(requestMutation.error)}</div>}
              </div>
            </form>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Your quote register</h2>
                <p className={styles.panelHint}>Quotes returned by the backend for your account.</p>
              </div>
              <span className={styles.status}>{visibleQuotes.length} records</span>
            </div>
            <div className={styles.panelBody}>
              {quotesQuery.isLoading ? (
                <p className={styles.loadingState}>Loading quote register…</p>
              ) : quotesQuery.isError ? (
                <div className={styles.errorPanel} role="alert">{getApiErrorMessage(quotesQuery.error)}</div>
              ) : visibleQuotes.length === 0 ? (
                <div className={styles.emptyState}>
                  <FileText size={22} />
                  <strong>No quotes yet</strong>
                  <p>Start a draft from the catalog. The persisted proposal will appear here when the workflow returns it.</p>
                </div>
              ) : (
                <div className={styles.rowList}>
                  {visibleQuotes.map((quote) => (
                    <button className={selectedQuoteId === quote.id ? styles.quoteRowActive : styles.quoteRow} type="button" key={quote.id} onClick={() => setSelectedQuoteId(quote.id)}>
                      <span className={styles.rowMain}>
                        <strong className={styles.rowTitle}>{quote.title || "Untitled proposal"}</strong>
                        <small className={styles.rowDescription}>{quote.currency} · {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : "Date unavailable"}</small>
                      </span>
                      <span className={quoteStatusClass(quote.status)}>{quote.status.replaceAll("_", " ")}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {detail && (
          <section className={styles.panel} style={{ marginTop: "1.2rem" }}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.meta}>QUOTE / {detail.id}</span>
                <h2 className={styles.panelTitle}>{detail.title}</h2>
                <p className={styles.panelHint}>All amounts below are returned by the backend. No client-side pricing calculation is performed.</p>
              </div>
              <span className={quoteStatusClass(detail.status)}>{detail.status.replaceAll("_", " ")}</span>
            </div>
            <div className={styles.panelBody}>
              {detail.executiveSummary && <p className={styles.summaryText}>{detail.executiveSummary}</p>}
              {detail.body && <div className={styles.proposalBody}>{detail.body}</div>}
              <div className={styles.quoteTotals}>
                <div><span>Subtotal</span><strong>{money(detail.subtotal, detail.currency)}</strong></div>
                <div><span>Discount</span><strong>{money(detail.discountTotal, detail.currency)}</strong></div>
                <div><span>Tax</span><strong>{money(detail.taxTotal, detail.currency)}</strong></div>
                <div className={styles.quoteTotal}><span>Total</span><strong>{money(detail.totalAmount, detail.currency)}</strong></div>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.dataTable}>
                  <thead><tr><th>Item</th><th>Quantity</th><th>Unit price</th><th>Tax</th><th>Line total</th></tr></thead>
                  <tbody>
                    {(detail.items ?? []).map((item) => (
                      <tr key={item.id}>
                        <td><strong>{item.nameSnapshot}</strong><br /><span className={styles.meta}>{item.sku}</span></td>
                        <td>{item.quantity}</td>
                        <td>{money(item.unitPriceSnapshot, detail.currency)}</td>
                        <td>{item.taxRatePercent}%</td>
                        <td>{money(item.lineTotal, detail.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {isAdmin && detail.status === "PENDING_APPROVAL" && (
                <div className={styles.approvalBox}>
                  <div className={styles.infoPanel}><ShieldCheck size={17} /><span>Admin approval is required before this proposal becomes approved.</span></div>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Decision comment</span>
                    <textarea className={styles.textArea} value={decisionComment} onChange={(event) => setDecisionComment(event.target.value)} maxLength={2000} placeholder="Add context for the approval decision." />
                  </label>
                  <div className={styles.decisionButtons}>
                    <button className={styles.primaryButton} type="button" disabled={decisionMutation.isPending} onClick={() => decisionMutation.mutate({ decision: "approve" })}>Approve quote</button>
                    <button className={styles.dangerButton} type="button" disabled={decisionMutation.isPending} onClick={() => decisionMutation.mutate({ decision: "reject" })}>Reject quote</button>
                  </div>
                  {decisionMutation.isError && <div className={styles.errorPanel} role="alert">{getApiErrorMessage(decisionMutation.error)}</div>}
                  {decisionMutation.isSuccess && <div className={styles.successPanel}>Decision saved and quote register refreshed.</div>}
                </div>
              )}
              {!isAdmin && detail.status === "PENDING_APPROVAL" && (
                <div className={styles.infoPanel}><ShieldCheck size={17} /><span>This proposal is awaiting an Admin decision. Sales users cannot approve their own quotes.</span></div>
              )}
              {detail.rejectionReason && <div className={styles.errorPanel}>{detail.rejectionReason}</div>}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
