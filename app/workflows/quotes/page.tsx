"use client";
/* Hallmark · v2.0.0 · redesign: full · scope: app · genre: modern-minimal · theme: Cobalt · signature: quote approval queue */

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  BadgeCheck,
  CircleDollarSign,
  FileCheck2,
  FilePlus2,
  LoaderCircle,
  PackagePlus,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  XCircle,
} from "lucide-react";
import { WorkflowPageHeading } from "@/components/workflows/WorkflowChrome";
import { useAuth } from "@/components/providers/AuthProvider";
import { leadService } from "@/services/lead.service";
import { getCustomers } from "@/services/customer.service";
import { getApiErrorMessage } from "@/services/api-client";
import { t12WorkflowService } from "@/services/t12-workflows.service";
import type { CreateCatalogItemInput, ProductCatalogItem, Quote, T12EntityType } from "@/types/t12-workflows";

function newIdempotencyKey() {
  return globalThis.crypto?.randomUUID?.() ?? `wf12-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function money(value: string | number, currency: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `${value} ${currency}`;
  try {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}

function statusTone(status?: string) {
  if (status === "APPROVED") return "wf-state wf-state--success";
  if (status === "REJECTED" || status === "FAILED") return "wf-state wf-state--danger";
  if (status === "PENDING_APPROVAL" || status === "PENDING") return "wf-state wf-state--warning";
  return "wf-state wf-state--info";
}

export default function QuotesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [entityType, setEntityType] = React.useState<T12EntityType>("Lead");
  const [entityId, setEntityId] = React.useState("");
  const [quantities, setQuantities] = React.useState<Record<string, number>>({});
  const [requirements, setRequirements] = React.useState("");
  const [targetWorkflowRunId, setTargetWorkflowRunId] = React.useState<string | null>(null);
  const [pollingStartedAt, setPollingStartedAt] = React.useState<number | null>(null);
  const [selectedQuoteId, setSelectedQuoteId] = React.useState<string | null>(null);
  const [approvalComment, setApprovalComment] = React.useState("");
  const [showCatalogForm, setShowCatalogForm] = React.useState(false);
  const [catalogForm, setCatalogForm] = React.useState<CreateCatalogItemInput>({ sku: "", name: "", description: "", unitPrice: 0, currency: "VND", taxRatePercent: 0 });

  const leadsQuery = useQuery({ queryKey: ["wf12-leads"], queryFn: () => leadService.getLeads({ page: 1, limit: 100 }), enabled: entityType === "Lead" });
  const customersQuery = useQuery({ queryKey: ["wf12-customers"], queryFn: () => getCustomers({ page: 1, limit: 100 }), enabled: entityType === "Customer" });
  const catalogQuery = useQuery({ queryKey: ["wf12-catalog"], queryFn: t12WorkflowService.listCatalog });
  const quotesQuery = useQuery({
    queryKey: ["wf12-quotes"],
    queryFn: t12WorkflowService.listQuotes,
    refetchInterval: (query) => {
      if (!targetWorkflowRunId || !pollingStartedAt) return false;
      if (query.state.data?.some((quote) => quote.workflowRunId === targetWorkflowRunId)) return false;
      return Date.now() - pollingStartedAt < 120_000 ? 3000 : false;
    },
  });
  const quoteDetailQuery = useQuery({ queryKey: ["wf12-quote", selectedQuoteId], queryFn: () => t12WorkflowService.getQuote(selectedQuoteId!), enabled: Boolean(selectedQuoteId), retry: false });

  React.useEffect(() => {
    if (!targetWorkflowRunId || !quotesQuery.data) return;
    const matchingQuote = quotesQuery.data.find((quote) => quote.workflowRunId === targetWorkflowRunId);
    if (matchingQuote) {
      setSelectedQuoteId(matchingQuote.id);
      setTargetWorkflowRunId(null);
      setPollingStartedAt(null);
    }
  }, [quotesQuery.data, targetWorkflowRunId]);

  const leads = leadsQuery.data?.data ?? [];
  const customers = customersQuery.data?.data ?? [];
  const catalog = catalogQuery.data ?? [];
  const quotes = quotesQuery.data ?? [];
  const selectedCatalogItems = catalog.filter((item) => (quantities[item.id] ?? 0) > 0);
  const currencies = [...new Set(selectedCatalogItems.map((item) => item.currency.toUpperCase()))];
  const quoteCurrency = currencies.length === 1 ? currencies[0] : "";
  const hasMixedCurrencies = currencies.length > 1;
  const selectedLines = selectedCatalogItems.map((item) => ({ catalogItemId: item.id, quantity: quantities[item.id] }));
  const recordLoading = entityType === "Lead" ? leadsQuery.isLoading : customersQuery.isLoading;
  const recordError = entityType === "Lead" ? leadsQuery.error : customersQuery.error;
  const hasRecords = entityType === "Lead" ? leads.length > 0 : customers.length > 0;
  const pollingTimedOut = Boolean(targetWorkflowRunId && pollingStartedAt && Date.now() - pollingStartedAt >= 120_000);

  const requestMutation = useMutation({
    mutationFn: () => t12WorkflowService.requestQuoteDraft({
      ...(entityType === "Lead" ? { leadId: entityId } : { customerId: entityId }),
      requestedItems: selectedLines,
      requirements: requirements.trim() || undefined,
      currency: quoteCurrency,
    }, newIdempotencyKey()),
    onSuccess: (result) => {
      setTargetWorkflowRunId(result.workflowRunId);
      setPollingStartedAt(Date.now());
      void quotesQuery.refetch();
    },
  });
  const catalogMutation = useMutation({
    mutationFn: (input: CreateCatalogItemInput) => t12WorkflowService.createCatalogItem(input),
    onSuccess: async () => {
      setCatalogForm({ sku: "", name: "", description: "", unitPrice: 0, currency: "VND", taxRatePercent: 0 });
      setShowCatalogForm(false);
      await queryClient.invalidateQueries({ queryKey: ["wf12-catalog"] });
    },
  });
  const approvalMutation = useMutation({
    mutationFn: ({ quoteId, decision }: { quoteId: string; decision: "APPROVE" | "REJECT" }) =>
      decision === "APPROVE"
        ? t12WorkflowService.approveQuote(quoteId, { comment: approvalComment.trim() || undefined })
        : t12WorkflowService.rejectQuote(quoteId, { comment: approvalComment.trim() || undefined }),
    onSuccess: async () => {
      setApprovalComment("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["wf12-quotes"] }),
        queryClient.invalidateQueries({ queryKey: ["wf12-quote", selectedQuoteId] }),
      ]);
    },
  });

  const quote = quoteDetailQuery.data;
  const canDecide = Boolean(isAdmin && quote?.status === "PENDING_APPROVAL" && quote.approval?.status === "PENDING");
  const pageError = requestMutation.error || catalogMutation.error || approvalMutation.error || catalogQuery.error || quotesQuery.error;

  return (
    <div className="wf-screen">
      <WorkflowPageHeading code="WF12 · T12" title="Quote & proposal" description="Build a proposal from the approved product catalog. The backend recalculates prices and taxes and controls the approval decision.">
        <button type="button" className="wf-action wf-action--quiet" onClick={() => { void catalogQuery.refetch(); void quotesQuery.refetch(); }} disabled={catalogQuery.isFetching || quotesQuery.isFetching}><RefreshCw size={15} /> Refresh</button>
      </WorkflowPageHeading>

      {pageError && <div role="alert" className="wf-callout wf-callout--danger"><AlertCircle size={16} /><p>{getApiErrorMessage(pageError)}</p></div>}
      <div className="wf-callout wf-callout--info"><ShieldCheck size={16} /><p><strong>Pricing and approval authority.</strong> Quote lines are recalculated from active catalog data by the backend. This screen does not calculate prices, invent discounts or bypass Admin approval.</p></div>

      <div className="wf-work-grid">
        <section className="wf-panel" aria-labelledby="wf12-builder-title">
          <div className="wf-panel__head"><div><h2 id="wf12-builder-title" className="wf-panel__title">Create a quote request</h2><p className="wf-panel__hint">Select one record and up to 50 distinct catalog items.</p></div><ShoppingCart size={17} color="var(--wf-accent)" aria-hidden="true" /></div>
          <div className="wf-panel__body">
            <form className="wf-stack" onSubmit={(event) => { event.preventDefault(); requestMutation.mutate(); }}>
              <div className="wf-fields">
                <label className="wf-field-wrap"><span className="wf-field-label">Record type</span><select value={entityType} onChange={(event) => { setEntityType(event.target.value as T12EntityType); setEntityId(""); }}><option value="Lead">Lead</option><option value="Customer">Customer</option></select></label>
                <label className="wf-field-wrap"><span className="wf-field-label">Lead / Customer</span><select required value={entityId} onChange={(event) => setEntityId(event.target.value)} disabled={recordLoading || Boolean(recordError)}><option value="">Choose a record</option>{entityType === "Lead" && leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.firstName} {lead.lastName} | {lead.companyName}</option>)}{entityType === "Customer" && customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} | {customer.companyName || customer.email}</option>)}</select>{recordLoading && <span className="wf-field-help">Loading records…</span>}{recordError && <span className="wf-field-help" role="alert">{getApiErrorMessage(recordError)}</span>}{!recordLoading && !recordError && !hasRecords && <span className="wf-field-help">No accessible records were returned.</span>}</label>
              </div>

              <div className="wf-toolbar"><div><h3 className="wf-panel__title">Product catalog</h3><p className="wf-panel__hint">{catalogQuery.isLoading ? "Loading catalog…" : `${catalog.length} active item(s) · prices from backend catalog`}</p></div>{isAdmin && <button type="button" className="wf-action" onClick={() => setShowCatalogForm((value) => !value)}><PackagePlus size={15} /> {showCatalogForm ? "Close form" : "Add catalog item"}</button>}</div>

              {showCatalogForm && isAdmin && <form className="wf-well wf-stack" onSubmit={(event) => { event.preventDefault(); catalogMutation.mutate({ ...catalogForm, description: catalogForm.description?.trim() || undefined }); }}>
                <h3 className="wf-panel__title">New catalog item</h3>
                <div className="wf-fields">
                  <label className="wf-field-wrap"><span className="wf-field-label">SKU</span><input required maxLength={80} value={catalogForm.sku} onChange={(event) => setCatalogForm({ ...catalogForm, sku: event.target.value })} /></label>
                  <label className="wf-field-wrap"><span className="wf-field-label">Product name</span><input required maxLength={200} value={catalogForm.name} onChange={(event) => setCatalogForm({ ...catalogForm, name: event.target.value })} /></label>
                  <label className="wf-field-wrap"><span className="wf-field-label">Unit price</span><input required type="number" min="0" step="0.01" value={catalogForm.unitPrice} onChange={(event) => setCatalogForm({ ...catalogForm, unitPrice: Number(event.target.value) })} /></label>
                  <label className="wf-field-wrap"><span className="wf-field-label">Currency</span><input required minLength={3} maxLength={3} value={catalogForm.currency} onChange={(event) => setCatalogForm({ ...catalogForm, currency: event.target.value.toUpperCase() })} /></label>
                  <label className="wf-field-wrap"><span className="wf-field-label">Tax rate (%)</span><input required type="number" min="0" max="100" step="0.01" value={catalogForm.taxRatePercent} onChange={(event) => setCatalogForm({ ...catalogForm, taxRatePercent: Number(event.target.value) })} /></label>
                  <label className="wf-field-wrap"><span className="wf-field-label">Description</span><input maxLength={5000} value={catalogForm.description ?? ""} onChange={(event) => setCatalogForm({ ...catalogForm, description: event.target.value })} /></label>
                </div>
                {catalogMutation.error && <p role="alert" className="wf-field-help">{getApiErrorMessage(catalogMutation.error)}</p>}
                <div className="wf-action-row"><button type="submit" className="wf-action wf-action--primary" disabled={catalogMutation.isPending || !catalogForm.sku.trim() || !catalogForm.name.trim()}>{catalogMutation.isPending ? <LoaderCircle size={15} className="animate-spin" /> : <PackagePlus size={15} />} Save catalog item</button></div>
              </form>}

              {catalogQuery.isLoading ? <div className="wf-loading"><LoaderCircle size={17} className="animate-spin" /> Loading catalog items…</div> : catalogQuery.error ? <div role="alert" className="wf-callout wf-callout--danger"><AlertCircle size={16} /><p>{getApiErrorMessage(catalogQuery.error)}</p></div> : catalog.length === 0 ? <div className="wf-empty"><PackagePlus size={21} /><strong>No active catalog items</strong><p>An Admin must add approved catalog items before a quote can be requested.</p></div> : <div className="wf-table-wrap"><table className="wf-table" style={{ minWidth: 620 }}><thead><tr><th scope="col">Product</th><th scope="col">Unit price</th><th scope="col">Tax</th><th scope="col">Quantity</th></tr></thead><tbody>{catalog.map((item: ProductCatalogItem) => {
                const quantity = quantities[item.id] ?? 0;
                return <tr key={item.id} aria-selected={quantity > 0}><td><span className="wf-mono block">{item.sku}</span><span className="wf-table__primary block mt-1">{item.name}</span>{item.description && <span className="wf-subtle block mt-1">{item.description}</span>}</td><td className="whitespace-nowrap">{money(item.unitPrice, item.currency)}</td><td>{Number(item.taxRatePercent)}%</td><td><label className="sr-only" htmlFor={`qty-${item.id}`}>Quantity for {item.name}</label><input id={`qty-${item.id}`} aria-label={`Quantity for ${item.name}`} type="number" min="0" max="10000" step="1" value={quantity} onChange={(event) => setQuantities((current) => ({ ...current, [item.id]: Math.min(10000, Math.max(0, Number(event.target.value) || 0)) }))} style={{ width: 86, minHeight: 38 }} /></td></tr>;
              })}</tbody></table></div>}

              <label className="wf-field-wrap"><span className="wf-field-label">Proposal requirements <span className="wf-subtle">(optional)</span></span><textarea rows={4} maxLength={10000} value={requirements} onChange={(event) => setRequirements(event.target.value)} placeholder="Customer goals, scope, delivery expectations or proposal context…" /></label>
              {hasMixedCurrencies && <div role="alert" className="wf-callout wf-callout--danger"><AlertCircle size={16} /><p>Selected products use multiple currencies. Select products with one currency only.</p></div>}
              {selectedLines.length > 50 && <div role="alert" className="wf-callout wf-callout--danger"><AlertCircle size={16} /><p>The API accepts at most 50 distinct catalog items.</p></div>}
              {selectedLines.length > 0 && !hasMixedCurrencies && <p className="wf-subtle">{selectedLines.length} distinct item(s) selected · {quoteCurrency}. The backend will calculate subtotal, tax and total.</p>}
              <div className="wf-action-row"><button type="submit" className="wf-action wf-action--primary" disabled={!entityId || selectedLines.length === 0 || selectedLines.length > 50 || hasMixedCurrencies || !quoteCurrency || requestMutation.isPending || catalogQuery.isLoading || recordLoading}><FilePlus2 size={16} />{requestMutation.isPending ? "Submitting quote request…" : "Generate quote proposal"}</button></div>
            </form>
          </div>
        </section>

        <div className="wf-stack">
          <section className="wf-panel" aria-labelledby="wf12-queue-title">
            <div className="wf-panel__head"><div><h2 id="wf12-queue-title" className="wf-panel__title">Quote queue</h2><p className="wf-panel__hint">Quotes visible to the signed-in account and Admin users.</p></div><button type="button" className="wf-action wf-action--quiet" onClick={() => void quotesQuery.refetch()} disabled={quotesQuery.isFetching} aria-label="Refresh quote queue"><RefreshCw size={15} /></button></div>
            <div className="wf-panel__body wf-stack">
              {targetWorkflowRunId && <div className="wf-callout wf-callout--info"><LoaderCircle size={16} className="animate-spin" /><p><strong>Waiting for the quote record.</strong><br /><span className="wf-mono">{targetWorkflowRunId}</span>{pollingTimedOut ? " | automatic refresh stopped after two minutes; refresh the queue to check again." : " | checking every three seconds."}</p></div>}
              {quotesQuery.isLoading ? <div className="wf-loading"><LoaderCircle size={17} className="animate-spin" /> Loading quote records…</div> : quotesQuery.error ? <div role="alert" className="wf-callout wf-callout--danger"><AlertCircle size={16} /><p>{getApiErrorMessage(quotesQuery.error)}</p></div> : quotes.length === 0 ? <div className="wf-empty"><FileCheck2 size={21} /><strong>No quotes yet</strong><p>Submitted proposals will appear here when the workflow creates a quote record.</p></div> : <div className="wf-list">{quotes.map((item: Quote) => <button key={item.id} type="button" className="wf-record-select" aria-pressed={selectedQuoteId === item.id} onClick={() => setSelectedQuoteId(item.id)}><span className="min-w-0 text-left"><span className="wf-list__item-title block">{item.title}</span><span className="wf-subtle block mt-1">{new Date(item.createdAt).toLocaleString()} · {item.currency}</span></span><span className="shrink-0 text-right"><span className="block text-sm font-semibold tabular-nums">{money(item.totalAmount, item.currency)}</span><span className={`${statusTone(item.status)} mt-1`}>{item.status}</span></span></button>)}</div>}
            </div>
          </section>

          <section className="wf-panel" aria-labelledby="wf12-detail-title">
            <div className="wf-panel__head"><div><h2 id="wf12-detail-title" className="wf-panel__title">Quote details</h2><p className="wf-panel__hint">Backend-calculated line totals and approval state.</p></div><FileCheck2 size={17} color="var(--wf-accent)" /></div>
            <div className="wf-panel__body wf-stack">
              {!selectedQuoteId && <div className="wf-empty"><FileCheck2 size={21} /><strong>No quote selected</strong><p>Select an entry in the quote queue to inspect its line items and approval state.</p></div>}
              {quoteDetailQuery.isLoading && <div className="wf-loading"><LoaderCircle size={16} className="animate-spin" /> Loading quote details…</div>}
              {quoteDetailQuery.error && <div role="alert" className="wf-callout wf-callout--danger"><AlertCircle size={16} /><p>{getApiErrorMessage(quoteDetailQuery.error)}</p></div>}
              {quote && <>
                <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="wf-result-heading">{quote.title}</h3><p className="wf-mono mt-1">{quote.id}</p></div><span className={statusTone(quote.status)}>{quote.status}</span></div>
                {quote.executiveSummary && <section className="wf-result-block"><h3 className="wf-result-heading">Executive summary</h3><p className="wf-result-copy">{quote.executiveSummary}</p></section>}
                {quote.body && <details className="wf-well"><summary className="wf-field-label">Proposal body</summary><p className="wf-result-copy">{quote.body}</p></details>}
                <section className="wf-result-block"><h3 className="wf-result-heading">Line items ({quote.items?.length ?? 0})</h3>{quote.items?.length ? <div className="wf-table-wrap mt-2"><table className="wf-table" style={{ minWidth: 480 }}><thead><tr><th scope="col">Item</th><th scope="col">Qty</th><th scope="col">Unit price</th><th scope="col">Line total</th></tr></thead><tbody>{quote.items.map((item) => <tr key={item.id}><td><span className="wf-table__primary block">{item.nameSnapshot}</span><span className="wf-subtle block">{item.sku}</span></td><td>{item.quantity}</td><td className="whitespace-nowrap">{money(item.unitPriceSnapshot, quote.currency)}</td><td className="whitespace-nowrap font-semibold">{money(item.lineTotal, quote.currency)}</td></tr>)}</tbody></table></div> : <p className="wf-subtle mt-2">No line items returned.</p>}</section>
                <dl className="wf-well wf-stack"><div className="flex justify-between gap-3"><dt className="wf-subtle">Subtotal</dt><dd className="font-medium tabular-nums">{money(quote.subtotal, quote.currency)}</dd></div><div className="flex justify-between gap-3"><dt className="wf-subtle">Discount</dt><dd className="font-medium tabular-nums">{money(quote.discountTotal, quote.currency)}</dd></div><div className="flex justify-between gap-3"><dt className="wf-subtle">Tax</dt><dd className="font-medium tabular-nums">{money(quote.taxTotal, quote.currency)}</dd></div><div className="flex justify-between gap-3 border-t border-[var(--wf-rule)] pt-3"><dt className="font-semibold">Total</dt><dd className="text-base font-semibold tabular-nums">{money(quote.totalAmount, quote.currency)}</dd></div></dl>
                <section className="wf-result-block"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="wf-result-heading">Approval</h3><span className={statusTone(quote.approval?.status ?? (quote.approvalRequired ? "PENDING" : "NOT_REQUIRED"))}>{quote.approval?.status ?? (quote.approvalRequired ? "Pending workflow" : "Not required")}</span></div><p className="wf-subtle mt-2">{quote.approval?.decisionComment || quote.rejectionReason || (quote.approvalRequired ? "An Admin decision is required before this quote is approved." : "The backend reports that this quote does not require human approval.")}</p></section>
                {canDecide && <section className="wf-result-block"><h3 className="wf-result-heading">Admin decision</h3><label className="wf-field-wrap mt-3"><span className="wf-field-label">Decision comment <span className="wf-subtle">(optional)</span></span><input value={approvalComment} onChange={(event) => setApprovalComment(event.target.value)} maxLength={2000} placeholder="Add context for this decision" /></label><div className="wf-action-row mt-3"><button type="button" className="wf-action wf-action--primary" disabled={approvalMutation.isPending} onClick={() => approvalMutation.mutate({ quoteId: quote.id, decision: "APPROVE" })}><BadgeCheck size={15} /> Approve</button><button type="button" className="wf-action wf-action--danger" disabled={approvalMutation.isPending} onClick={() => { if (window.confirm("Reject this quote?")) approvalMutation.mutate({ quoteId: quote.id, decision: "REJECT" }); }}><XCircle size={15} /> Reject</button></div></section>}
                {quote.approvalRequired && quote.approval?.status === "PENDING" && !isAdmin && <div className="wf-callout wf-callout--warning"><ShieldCheck size={16} /><p>This quote is pending an Admin decision. You can monitor its status here.</p></div>}
                <p className="wf-subtle">WorkflowRun: <span className="wf-mono">{quote.workflowRunId}</span></p>
              </>}
            </div>
          </section>
        </div>
      </div>
      <div className="wf-callout wf-callout--info"><CircleDollarSign size={16} /><p>Displayed totals are returned by the backend. This UI intentionally does not calculate prices or submit discounts. Approval permissions are enforced by backend authorization.</p></div>
    </div>
  );
}
