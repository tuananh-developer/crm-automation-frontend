"use client";

import Link from "next/link";
import { Suspense, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Plus,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { getApiErrorMessage } from "@/services/api-client";
import { getCustomers } from "@/services/customer.service";
import {
  approveRenewalAttempt,
  createContract,
  createRenewalAttempt,
  getDueContracts,
  listApprovalTasks,
  listContracts,
  listRenewalAttempts,
} from "@/services/renewal.service";
import type { CustomerContract, RenewalAttempt } from "@/types/renewal";
import styles from "@/components/workspace/workspace.module.css";

function formatMoney(amount: string | number | null): string {
  if (amount === null || amount === undefined || amount === "") return "—";
  const value = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(value)) return String(amount);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function computeUrgencyLabel(renewalDate: string | null): {
  level: string;
  days: number | null;
} {
  if (!renewalDate) return { level: "UNSCHEDULED", days: null };
  const target = new Date(renewalDate);
  if (Number.isNaN(target.getTime())) return { level: "UNKNOWN", days: null };
  const diffDays = Math.ceil(
    (target.getTime() - Date.now()) / (24 * 60 * 60 * 1000),
  );
  if (diffDays < 0) return { level: "EXPIRED", days: diffDays };
  if (diffDays <= 7) return { level: "CRITICAL", days: diffDays };
  if (diffDays <= 30) return { level: "HIGH", days: diffDays };
  if (diffDays <= 60) return { level: "MEDIUM", days: diffDays };
  return { level: "LOW", days: diffDays };
}

function contractStatusClass(status: string): string {
  const upper = status.toUpperCase();
  if (upper === "ACTIVE" || upper === "RENEWED") return styles.statusGreen;
  if (upper === "PENDING_RENEWAL") return styles.statusAmber;
  if (upper === "EXPIRED" || upper === "CANCELLED") return styles.statusRed;
  return styles.statusBlue;
}

function attemptStatusClass(status: string): string {
  const upper = status.toUpperCase();
  if (upper === "APPROVED" || upper === "SENT") return styles.statusGreen;
  if (upper === "DRAFT" || upper === "PROCESSING") return styles.statusAmber;
  if (
    upper === "FAILED" ||
    upper === "PERMANENT_FAILURE" ||
    upper === "RETRYABLE_FAILURE" ||
    upper === "UNKNOWN"
  ) {
    return styles.statusRed;
  }
  return styles.statusBlue;
}

function createIdempotencyKey(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}:${crypto.randomUUID()}`;
  }
  return `${prefix}:${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function RenewalsWorkbenchContent() {
  const searchParams = useSearchParams();
  const initialCustomerId = searchParams.get("customerId") ?? "";
  const initialContractId = searchParams.get("contractId") ?? "";

  const queryClient = useQueryClient();

  const [filterMode, setFilterMode] = useState<"ALL" | "DUE">("ALL");
  const [dueWindowDays, setDueWindowDays] = useState<number>(30);
  const [selectedContractId, setSelectedContractId] = useState<string>(
    initialContractId,
  );
  const [selectedAttemptId, setSelectedAttemptId] = useState<string>("");

  // New contract form state
  const [customerId, setCustomerId] = useState<string>(initialCustomerId);
  const [contractNumber, setContractNumber] = useState<string>("");
  const [contractStatus, setContractStatus] = useState<string>("ACTIVE");
  const [startDate, setStartDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState<string>(() => {
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    return nextYear.toISOString().slice(0, 10);
  });
  const [renewalDate, setRenewalDate] = useState<string>(() => {
    const inTwoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    return inTwoWeeks.toISOString().slice(0, 10);
  });
  const [amount, setAmount] = useState<string>("12000");

  // New renewal draft form state
  const [draftRecommendation, setDraftRecommendation] = useState<string>("");
  const [draftContent, setDraftContent] = useState<string>("");

  // Approval attestation state
  const [consentGranted, setConsentGranted] = useState<boolean>(true);
  const [templateApproved, setTemplateApproved] = useState<boolean>(true);
  const [policyApproved, setPolicyApproved] = useState<boolean>(true);
  const [approvalComment, setApprovalComment] = useState<string>("");

  const customersQuery = useQuery({
    queryKey: ["customers", "renewals-workbench"],
    queryFn: () => getCustomers({ limit: 100, page: 1 }),
  });

  const contractsQuery = useQuery({
    queryKey: ["customer-contracts", filterMode, dueWindowDays],
    queryFn: () =>
      filterMode === "DUE"
        ? getDueContracts(dueWindowDays)
        : listContracts(),
  });

  const customersMap = useMemo(() => {
    const map = new Map<string, { name: string; companyName: string | null; email: string }>();
    for (const c of customersQuery.data?.data ?? []) {
      map.set(c.id, {
        name: c.name,
        companyName: c.companyName,
        email: c.email,
      });
    }
    return map;
  }, [customersQuery.data?.data]);

  const contracts = useMemo(
    () => contractsQuery.data ?? [],
    [contractsQuery.data],
  );

  const activeContract: CustomerContract | null = useMemo(() => {
    if (contracts.length === 0) return null;
    if (selectedContractId) {
      const found = contracts.find((c) => c.id === selectedContractId);
      if (found) return found;
    }
    return contracts[0];
  }, [contracts, selectedContractId]);

  const attemptsQuery = useQuery({
    queryKey: ["renewal-attempts", activeContract?.id],
    queryFn: () => listRenewalAttempts(activeContract!.id),
    enabled: Boolean(activeContract?.id),
  });

  const approvalTasksQuery = useQuery({
    queryKey: ["renewal-approval-tasks", activeContract?.id],
    queryFn: () => listApprovalTasks(activeContract!.id),
    enabled: Boolean(activeContract?.id),
  });

  const attempts = useMemo(
    () => attemptsQuery.data ?? [],
    [attemptsQuery.data],
  );

  const activeAttempt: RenewalAttempt | null = useMemo(() => {
    if (attempts.length === 0) return null;
    if (selectedAttemptId) {
      const found = attempts.find((a) => a.id === selectedAttemptId);
      if (found) return found;
    }
    return attempts[0];
  }, [attempts, selectedAttemptId]);

  const createContractMutation = useMutation({
    mutationFn: () =>
      createContract({
        customerId,
        contractNumber: contractNumber.trim(),
        status: contractStatus,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        renewalDate: renewalDate
          ? new Date(renewalDate).toISOString()
          : undefined,
        amount: amount.trim() ? Number(amount) : undefined,
      }),
    onSuccess: (created) => {
      setContractNumber("");
      setSelectedContractId(created.id);
      queryClient.invalidateQueries({ queryKey: ["customer-contracts"] });
    },
  });

  const createAttemptMutation = useMutation({
    mutationFn: () => {
      const urgencyInfo = computeUrgencyLabel(activeContract!.renewalDate);
      return createRenewalAttempt(activeContract!.id, {
        contractId: activeContract!.id,
        customerId: activeContract!.customerId,
        renewalDate: activeContract!.renewalDate ?? undefined,
        urgency: urgencyInfo.level,
        recommendation:
          draftRecommendation.trim() ||
          `Propose renewal for contract ${activeContract!.contractNumber} prior to ${formatDate(activeContract!.renewalDate)}.`,
        draftContent:
          draftContent.trim() ||
          `Dear Customer, your contract ${activeContract!.contractNumber} is scheduled for renewal on ${formatDate(activeContract!.renewalDate)} with value ${formatMoney(activeContract!.amount)}. Please review our renewal terms.`,
        idempotencyKey: createIdempotencyKey(
          `renewal:${activeContract!.id}:draft`,
        ),
      });
    },
    onSuccess: (created) => {
      setDraftRecommendation("");
      setDraftContent("");
      setSelectedAttemptId(created.id);
      queryClient.invalidateQueries({
        queryKey: ["renewal-attempts", activeContract?.id],
      });
    },
  });

  const approveAttemptMutation = useMutation({
    mutationFn: (attemptId: string) =>
      approveRenewalAttempt(attemptId, {
        consentGranted,
        templateApproved,
        policyApproved,
        comment: approvalComment.trim() || undefined,
      }),
    onSuccess: () => {
      setApprovalComment("");
      queryClient.invalidateQueries({
        queryKey: ["renewal-attempts", activeContract?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["renewal-approval-tasks", activeContract?.id],
      });
    },
  });

  const handleCreateContract = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!customerId || !contractNumber.trim() || !startDate || !endDate) return;
    createContractMutation.mutate();
  };

  const handleCreateAttempt = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeContract) return;
    createAttemptMutation.mutate();
  };

  return (
    <>
      <WorkspaceHeader />
      <main id="main-content" tabIndex={-1} className={styles.screen}>
        <header className={styles.screenHead}>
          <div className={styles.screenHeadCopy}>
            <h1 className={styles.screenTitle}>Manage contract renewals.</h1>
            <p className={styles.screenDescription}>
              Monitor contracts approaching renewal windows, inspect AI-drafted
              renewal proposals, and record audited consent, template, and
              policy approvals (T12-WF13).
            </p>
          </div>
          <div className={styles.headMetric}>
            <span className={styles.meta}>Outreach policy</span>
            <strong>Fail-closed</strong>
            <span>consent, template &amp; policy verified</span>
          </div>
        </header>

        <div className={styles.twoColumn}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Register a customer contract</h2>
                <p className={styles.panelHint}>
                  Contracts within the renewal window are scanned daily by WF13.
                </p>
              </div>
              <Plus size={19} />
            </div>

            <form className={styles.panelBody} onSubmit={handleCreateContract}>
              <div className={styles.fieldStack}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Customer account</span>
                  <select
                    className={styles.selectInput}
                    value={customerId}
                    onChange={(event) => setCustomerId(event.target.value)}
                    required
                  >
                    <option value="">Choose a customer</option>
                    {(customersQuery.data?.data ?? []).map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} / {customer.companyName || customer.email}
                      </option>
                    ))}
                  </select>
                </label>

                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Contract number</span>
                    <input
                      type="text"
                      className={styles.textInput}
                      placeholder="CTR-2026-001"
                      value={contractNumber}
                      onChange={(event) => setContractNumber(event.target.value)}
                      maxLength={100}
                      required
                    />
                  </label>

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Status</span>
                    <select
                      className={styles.selectInput}
                      value={contractStatus}
                      onChange={(event) => setContractStatus(event.target.value)}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="PENDING_RENEWAL">PENDING_RENEWAL</option>
                      <option value="RENEWED">RENEWED</option>
                      <option value="EXPIRED">EXPIRED</option>
                    </select>
                  </label>
                </div>

                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Start date</span>
                    <input
                      type="date"
                      className={styles.textInput}
                      value={startDate}
                      onChange={(event) => setStartDate(event.target.value)}
                      required
                    />
                  </label>

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>End date</span>
                    <input
                      type="date"
                      className={styles.textInput}
                      value={endDate}
                      onChange={(event) => setEndDate(event.target.value)}
                      required
                    />
                  </label>
                </div>

                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>
                      Scheduled renewal date
                    </span>
                    <input
                      type="date"
                      className={styles.textInput}
                      value={renewalDate}
                      onChange={(event) => setRenewalDate(event.target.value)}
                    />
                  </label>

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>
                      Contract value (USD)
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className={styles.textInput}
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      placeholder="12000"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={
                    !customerId ||
                    !contractNumber.trim() ||
                    createContractMutation.isPending
                  }
                >
                  <FileText size={16} />{" "}
                  {createContractMutation.isPending
                    ? "Saving contract…"
                    : "Create contract"}
                </button>

                {createContractMutation.isError && (
                  <div className={styles.errorPanel} role="alert">
                    {getApiErrorMessage(createContractMutation.error)}
                  </div>
                )}
                {createContractMutation.isSuccess && (
                  <div className={styles.successPanel}>
                    Contract registered and added to the renewal queue.
                  </div>
                )}
              </div>
            </form>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Contract register</h2>
                <p className={styles.panelHint}>
                  Select a contract to inspect renewal drafts and approval tasks.
                </p>
              </div>
              <span className={styles.status}>{contracts.length} contracts</span>
            </div>

            <div className={styles.panelBody}>
              <div className={styles.fieldStack}>
                <div
                  className={styles.segmentControl}
                  role="group"
                  aria-label="Contract filter mode"
                >
                  <button
                    type="button"
                    className={
                      filterMode === "ALL"
                        ? styles.segmentActive
                        : styles.segment
                    }
                    onClick={() => setFilterMode("ALL")}
                  >
                    All contracts
                  </button>
                  <button
                    type="button"
                    className={
                      filterMode === "DUE"
                        ? styles.segmentActive
                        : styles.segment
                    }
                    onClick={() => setFilterMode("DUE")}
                  >
                    Due for renewal
                  </button>
                </div>

                {filterMode === "DUE" && (
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>
                      Renewal window (days ahead)
                    </span>
                    <select
                      className={styles.selectInput}
                      value={dueWindowDays}
                      onChange={(event) =>
                        setDueWindowDays(Number(event.target.value) || 30)
                      }
                    >
                      <option value={7}>Next 7 days (CRITICAL)</option>
                      <option value={14}>Next 14 days</option>
                      <option value={30}>Next 30 days (HIGH)</option>
                      <option value={60}>Next 60 days (MEDIUM)</option>
                      <option value={90}>Next 90 days</option>
                    </select>
                  </label>
                )}

                {contractsQuery.isLoading ? (
                  <p className={styles.loadingState}>
                    Loading customer contracts…
                  </p>
                ) : contractsQuery.isError ? (
                  <div className={styles.errorPanel} role="alert">
                    {getApiErrorMessage(contractsQuery.error)}
                  </div>
                ) : contracts.length === 0 ? (
                  <div className={styles.emptyState}>
                    <CalendarClock size={22} />
                    <strong>No contracts in this view</strong>
                    <p>
                      Register a contract on the left or switch the renewal
                      window filter.
                    </p>
                  </div>
                ) : (
                  <div className={styles.rowList}>
                    {contracts.map((contract) => {
                      const customerInfo = customersMap.get(contract.customerId);
                      const urgency = computeUrgencyLabel(contract.renewalDate);
                      const isSelected = activeContract?.id === contract.id;

                      return (
                        <button
                          key={contract.id}
                          type="button"
                          className={
                            isSelected ? styles.quoteRowActive : styles.quoteRow
                          }
                          onClick={() => {
                            setSelectedContractId(contract.id);
                            setSelectedAttemptId("");
                          }}
                        >
                          <span className={styles.rowMain}>
                            <strong className={styles.rowTitle}>
                              {contract.contractNumber} ·{" "}
                              {customerInfo?.name ??
                                `Customer ${contract.customerId.slice(0, 8)}`}
                            </strong>
                            <small className={styles.rowDescription}>
                              {formatMoney(contract.amount)} · Renewal:{" "}
                              {formatDate(contract.renewalDate)} (
                              {urgency.level}
                              {urgency.days !== null
                                ? `, ${urgency.days}d`
                                : ""}
                              )
                            </small>
                          </span>
                          <span className={contractStatusClass(contract.status)}>
                            {contract.status.toLowerCase().replaceAll("_", " ")}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {activeContract && (
          <section className={styles.panel} style={{ marginTop: "1.2rem" }}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.meta}>
                  Contract / {activeContract.contractNumber}
                </span>
                <h2 className={styles.panelTitle}>
                  Renewal Attempts &amp; Audited Approval Gate (WF13)
                </h2>
                <p className={styles.panelHint}>
                  Backend enforces fail-closed eligibility: automatic SMTP
                  delivery only proceeds when consent, template, and policy
                  attestations are verified.
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <Link
                  className={styles.inlineLink}
                  href={`/customers/${activeContract.customerId}`}
                >
                  View customer profile <ArrowUpRight size={14} />
                </Link>
                <span className={contractStatusClass(activeContract.status)}>
                  {activeContract.status.toLowerCase().replaceAll("_", " ")}
                </span>
              </div>
            </div>

            <div className={styles.panelBody}>
              <div className={styles.statStrip}>
                <div className={styles.statCell}>
                  <span className={styles.statLabel}>Contract value</span>
                  <strong className={styles.statValue}>
                    {formatMoney(activeContract.amount)}
                  </strong>
                </div>
                <div className={styles.statCell}>
                  <span className={styles.statLabel}>Start — End</span>
                  <strong className={styles.statValue}>
                    {formatDate(activeContract.startDate)} →{" "}
                    {formatDate(activeContract.endDate)}
                  </strong>
                </div>
                <div className={styles.statCell}>
                  <span className={styles.statLabel}>Renewal date</span>
                  <strong className={styles.statValue}>
                    {formatDate(activeContract.renewalDate)} (
                    {computeUrgencyLabel(activeContract.renewalDate).level})
                  </strong>
                </div>
              </div>

              <div className={styles.twoColumn} style={{ marginTop: "1.2rem" }}>
                <div className={styles.fieldStack}>
                  <h3 className={styles.panelTitle}>
                    Renewal drafts &amp; delivery attempts ({attempts.length})
                  </h3>

                  {attemptsQuery.isLoading ? (
                    <p className={styles.loadingState}>
                      Loading renewal attempts…
                    </p>
                  ) : attemptsQuery.isError ? (
                    <div className={styles.errorPanel} role="alert">
                      {getApiErrorMessage(attemptsQuery.error)}
                    </div>
                  ) : attempts.length === 0 ? (
                    <div className={styles.emptyState}>
                      <RefreshCw size={20} />
                      <strong>No renewal drafts recorded yet</strong>
                      <p>
                        WF13 generates drafts automatically during daily scans,
                        or you can record a renewal draft below for review.
                      </p>
                    </div>
                  ) : (
                    <div className={styles.rowList}>
                      {attempts.map((attempt) => {
                        const isSelected = activeAttempt?.id === attempt.id;
                        return (
                          <button
                            key={attempt.id}
                            type="button"
                            className={
                              isSelected
                                ? styles.quoteRowActive
                                : styles.quoteRow
                            }
                            onClick={() => setSelectedAttemptId(attempt.id)}
                          >
                            <span className={styles.rowMain}>
                              <strong className={styles.rowTitle}>
                                {attempt.urgency ?? "STANDARD"} urgency ·{" "}
                                {formatDate(attempt.createdAt)}
                              </strong>
                              <small className={styles.rowDescription}>
                                {attempt.recommendation ||
                                  attempt.draftContent ||
                                  attempt.idempotencyKey}
                              </small>
                            </span>
                            <span className={attemptStatusClass(attempt.status)}>
                              {attempt.status.toLowerCase().replaceAll("_", " ")}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <form
                    onSubmit={handleCreateAttempt}
                    className={styles.fieldStack}
                    style={{
                      marginTop: "0.8rem",
                      paddingTop: "0.8rem",
                      borderTop: "1px solid var(--desk-rule, #e2e8e4)",
                    }}
                  >
                    <span className={styles.fieldLabel}>
                      Record a new renewal proposal draft
                    </span>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>
                        Renewal strategy / recommendation
                      </span>
                      <input
                        type="text"
                        className={styles.textInput}
                        placeholder="Offer 12-month renewal with priority SLA support"
                        value={draftRecommendation}
                        onChange={(event) =>
                          setDraftRecommendation(event.target.value)
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>
                        Draft outreach message (grounded to contract number)
                      </span>
                      <textarea
                        className={styles.textArea}
                        placeholder={`Include contract number ${activeContract.contractNumber} in the message body for grounding verification.`}
                        value={draftContent}
                        onChange={(event) =>
                          setDraftContent(event.target.value)
                        }
                      />
                    </label>
                    <button
                      type="submit"
                      className={styles.secondaryButton}
                      disabled={createAttemptMutation.isPending}
                    >
                      <Plus size={15} />{" "}
                      {createAttemptMutation.isPending
                        ? "Recording draft…"
                        : "Save renewal draft"}
                    </button>
                    {createAttemptMutation.isError && (
                      <div className={styles.errorPanel} role="alert">
                        {getApiErrorMessage(createAttemptMutation.error)}
                      </div>
                    )}
                  </form>
                </div>

                <div className={styles.fieldStack}>
                  {activeAttempt ? (
                    <>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "0.5rem",
                        }}
                      >
                        <div>
                          <span className={styles.meta}>
                            Attempt / {activeAttempt.id.slice(0, 8)}
                          </span>
                          <h3 className={styles.panelTitle}>
                            Proposal inspection &amp; approval
                          </h3>
                        </div>
                        <span
                          className={attemptStatusClass(activeAttempt.status)}
                        >
                          {activeAttempt.status
                            .toLowerCase()
                            .replaceAll("_", " ")}
                        </span>
                      </div>

                      {activeAttempt.recommendation && (
                        <div className={styles.callout}>
                          <strong>AI Recommendation:</strong>{" "}
                          {activeAttempt.recommendation}
                        </div>
                      )}

                      {activeAttempt.draftContent && (
                        <div className={styles.proposalBody}>
                          {activeAttempt.draftContent}
                        </div>
                      )}

                      <div className={styles.infoPanel}>
                        <ShieldCheck size={17} />
                        <span>
                          Idempotency key:{" "}
                          <code className={styles.codeText}>
                            {activeAttempt.idempotencyKey}
                          </code>
                          {activeAttempt.communicationId
                            ? ` · Provider ID: ${activeAttempt.communicationId}`
                            : ""}
                        </span>
                      </div>

                      {activeAttempt.errorMessage && (
                        <div className={styles.errorPanel} role="alert">
                          <strong>
                            {activeAttempt.errorCode ?? "Delivery Error"}:
                          </strong>{" "}
                          {activeAttempt.errorMessage}
                        </div>
                      )}

                      <div className={styles.approvalBox}>
                        <div className={styles.infoPanel}>
                          <CheckCircle2 size={17} />
                          <span>
                            Explicit operator attestation for{" "}
                            <code className={styles.codeText}>
                              POST /api/v1/renewal-attempts/:attemptId/approve
                            </code>
                            . Backend independently verifies customer
                            contactability and contract grounding.
                          </span>
                        </div>

                        <div className={styles.checkList}>
                          <label className={styles.checkItem}>
                            <input
                              type="checkbox"
                              checked={consentGranted}
                              onChange={(event) =>
                                setConsentGranted(event.target.checked)
                              }
                            />
                            <span>
                              <strong>Customer consent verified</strong> —
                              Customer has valid outreach email and no opt-out
                              marker.
                            </span>
                          </label>

                          <label className={styles.checkItem}>
                            <input
                              type="checkbox"
                              checked={templateApproved}
                              onChange={(event) =>
                                setTemplateApproved(event.target.checked)
                              }
                            />
                            <span>
                              <strong>Communication template approved</strong> —
                              Draft message is grounded to contract{" "}
                              {activeContract.contractNumber}.
                            </span>
                          </label>

                          <label className={styles.checkItem}>
                            <input
                              type="checkbox"
                              checked={policyApproved}
                              onChange={(event) =>
                                setPolicyApproved(event.target.checked)
                              }
                            />
                            <span>
                              <strong>Commercial renewal policy verified</strong>{" "}
                              — Terms and renewal window comply with policy.
                            </span>
                          </label>
                        </div>

                        <label className={styles.field}>
                          <span className={styles.fieldLabel}>
                            Reviewer comment (optional)
                          </span>
                          <textarea
                            className={styles.textArea}
                            maxLength={500}
                            placeholder="Record audit note for this renewal approval decision."
                            value={approvalComment}
                            onChange={(event) =>
                              setApprovalComment(event.target.value)
                            }
                          />
                        </label>

                        <button
                          type="button"
                          className={styles.primaryButton}
                          disabled={
                            approveAttemptMutation.isPending ||
                            activeAttempt.status === "SENT"
                          }
                          onClick={() =>
                            approveAttemptMutation.mutate(activeAttempt.id)
                          }
                        >
                          <ShieldCheck size={16} />{" "}
                          {approveAttemptMutation.isPending
                            ? "Recording audited approval…"
                            : activeAttempt.status === "APPROVED"
                              ? "Re-verify & update approval"
                              : "Approve renewal attempt"}
                        </button>

                        {approveAttemptMutation.isError && (
                          <div className={styles.errorPanel} role="alert">
                            {getApiErrorMessage(approveAttemptMutation.error)}
                          </div>
                        )}
                        {approveAttemptMutation.isSuccess && (
                          <div className={styles.successPanel}>
                            Renewal draft approval recorded and audited in
                            backend.
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className={styles.emptyState}>
                      <ClipboardCheck size={20} />
                      <strong>Select or create a renewal draft</strong>
                      <p>
                        Choose an attempt on the left to inspect its AI proposal
                        and record human approval.
                      </p>
                    </div>
                  )}

                  {(approvalTasksQuery.data ?? []).length > 0 && (
                    <div className={styles.fieldStack}>
                      <span className={styles.fieldLabel}>
                        Linked human approval tasks (
                        {(approvalTasksQuery.data ?? []).length})
                      </span>
                      <div className={styles.tableWrap}>
                        <table className={styles.dataTable}>
                          <thead>
                            <tr>
                              <th>Task type</th>
                              <th>Priority</th>
                              <th>Status</th>
                              <th>Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(approvalTasksQuery.data ?? []).map((task) => (
                              <tr key={task.id}>
                                <td>
                                  <code className={styles.codeText}>
                                    {task.taskType}
                                  </code>
                                </td>
                                <td>{task.priority}</td>
                                <td>{task.status}</td>
                                <td>{task.notes ?? "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}

export default function RenewalsPage() {
  return (
    <Suspense
      fallback={
        <>
          <WorkspaceHeader />
          <main id="main-content" className={styles.screen}>
            <p className={styles.loadingState}>
              Loading contract renewals workbench…
            </p>
          </main>
        </>
      }
    >
      <RenewalsWorkbenchContent />
    </Suspense>
  );
}
