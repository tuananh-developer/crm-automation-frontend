"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  BadgeCheck,
  BrainCircuit,
  ClipboardCheck,
  FileText,
  ScanSearch,
  Users,
  Workflow,
} from "lucide-react";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { leadService } from "@/services/lead.service";
import { getReviewTasks } from "@/services/review.service";
import { getApiErrorMessage } from "@/services/api-client";
import type { Lead } from "@/types/lead";
import styles from "@/components/workspace/workspace.module.css";

const workstreams = [
  {
    code: "T12 / WF01",
    title: "Lead qualification",
    description: "Evaluate sales readiness, inspect model confidence, and route uncertain records to human review.",
    href: "/qualification",
    icon: BadgeCheck,
    state: "Lead intelligence",
  },
  {
    code: "T12 / WF08",
    title: "Data cleaning",
    description: "Scan CRM records, compare proposed corrections, then approve only the changes worth writing back.",
    href: "/data-cleaning",
    icon: ScanSearch,
    state: "Quality control",
  },
  {
    code: "T12 / WF10",
    title: "Next best action",
    description: "Request evidence-backed recommendations for a Lead or Customer. Approval stays with the operator.",
    href: "/next-best-actions",
    icon: BrainCircuit,
    state: "Decision support",
  },
  {
    code: "T12 / WF11",
    title: "Sales meetings",
    description: "Turn a meeting transcript into a redacted summary, decisions, risks, and confirmable action items.",
    href: "/sales-meetings",
    icon: ClipboardCheck,
    state: "Conversation intelligence",
  },
  {
    code: "T12 / WF12",
    title: "Quote & proposal",
    description: "Build a quote from the active catalog. Backend pricing and the approval policy remain authoritative.",
    href: "/quotes",
    icon: FileText,
    state: "Commercial workflow",
  },
];

function leadName(lead: Lead) {
  return [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "Unnamed lead";
}

export default function DashboardPage() {
  const leadsQuery = useQuery({
    queryKey: ["leads", "dashboard"],
    queryFn: () => leadService.getLeads({ limit: 100, page: 1 }),
  });
  const reviewsQuery = useQuery({
    queryKey: ["review-tasks"],
    queryFn: getReviewTasks,
  });

  const leads = useMemo(() => leadsQuery.data?.data ?? [], [leadsQuery.data?.data]);
  const qualified = leads.filter((lead) => lead.status === "QUALIFIED" || lead.status === "CONVERTED").length;
  const pendingReviews = (reviewsQuery.data ?? []).filter((task) => task.status === "PENDING").length;
  const totalLeads = leadsQuery.data?.meta?.total ?? leads.length;
  const leadError = leadsQuery.isError ? getApiErrorMessage(leadsQuery.error) : null;
  const reviewError = reviewsQuery.isError ? getApiErrorMessage(reviewsQuery.error) : null;

  return (
    <>
      <WorkspaceHeader />
      <main className={styles.screen}>
        <section className={styles.dashboardHero}>
          <div className={styles.dashboardHeroCopy}>
            <h1 className={styles.screenTitle}>See the signal.<br />Move the pipeline.</h1>
            <p className={styles.screenDescription}>
              Five workflows, one reviewable operating desk. Move each record with evidence and human review.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryButton} href="/leads">
                Open lead pipeline <ArrowUpRight size={16} />
              </Link>
              <Link className={styles.secondaryButton} href="/review">
                Review queue <ClipboardCheck size={15} />
              </Link>
            </div>
          </div>
          <div className={styles.dashboardHeroAside} aria-label="Current workflow coverage">
            <div className={styles.heroAsideTop}>
              <Workflow size={18} />
              <span>Owned workflow set</span>
            </div>
            <div className={styles.heroAsideCount}>05</div>
            <p>Workflows in this workspace</p>
            <div className={styles.heroAsideRule} />
            <div className={styles.heroAsideFoot}>
              <span>Operator-controlled</span>
              <span>Human approval retained</span>
            </div>
          </div>
        </section>

        <section className={styles.statStrip} aria-label="Live CRM overview">
          <div className={styles.statCell}>
            <span className={styles.statLabel}>Lead records</span>
            <div className={styles.statValue}>{leadsQuery.isLoading ? "—" : totalLeads}</div>
            <span className={styles.statFoot}>Visible in your current scope</span>
          </div>
          <div className={styles.statCell}>
            <span className={styles.statLabel}>Qualified or converted</span>
            <div className={styles.statValue}>{leadsQuery.isLoading ? "—" : qualified}</div>
            <span className={styles.statFoot}>Current lead statuses</span>
          </div>
          <div className={styles.statCell}>
            <span className={styles.statLabel}>Awaiting review</span>
            <div className={styles.statValue}>{reviewsQuery.isLoading ? "—" : pendingReviews}</div>
            <span className={styles.statFoot}>Pending human decisions</span>
          </div>
        </section>

        {(leadError || reviewError) && (
          <div className={styles.errorPanel} role="alert">
            <strong>Part of the workspace could not be loaded.</strong>
            <span>{[leadError, reviewError].filter(Boolean).join(" / ")}</span>
          </div>
        )}

        <div className={styles.sectionHeadRow}>
          <div>
            <h2 className={styles.sectionTitle}>Your workstreams</h2>
            <p className={styles.sectionDescription}>Launch the workflow that matches the decision in front of you.</p>
          </div>
          <span className={styles.meta}>T12 / 01—05</span>
        </div>

        <section className={styles.workflowGrid} aria-label="Tuấn Anh owned workflows">
          {workstreams.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link className={styles.workflowTile} href={item.href} key={item.code}>
                <div className={styles.workflowTileTop}>
                  <span className={styles.workflowNumber}>{String(index + 1).padStart(2, "0")}</span>
                  <Icon size={19} strokeWidth={1.8} />
                </div>
                <span className={styles.workflowCode}>{item.code}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <div className={styles.workflowTileFoot}>
                  <span>{item.state}</span>
                  <ArrowUpRight size={16} />
                </div>
              </Link>
            );
          })}
        </section>

        <section className={styles.dashboardBottom}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Latest leads</h2>
                <p className={styles.panelHint}>A quick path back to the records driving the work.</p>
              </div>
              <Link className={styles.inlineLink} href="/leads">View pipeline <ArrowUpRight size={14} /></Link>
            </div>
            <div className={styles.panelBody}>
              {leadsQuery.isLoading ? (
                <div className={styles.loadingState}>Loading the current lead scope…</div>
              ) : leads.length === 0 ? (
                <div className={styles.emptyState}>
                  <Users size={22} />
                  <strong>No leads in this scope yet</strong>
                  <p>Create or import a lead to begin qualification and follow-up work.</p>
                  <Link className={styles.secondaryButton} href="/leads">Open leads</Link>
                </div>
              ) : (
                <div className={styles.rowList}>
                  {leads.slice(0, 5).map((lead) => (
                    <Link className={styles.rowItemLink} href={`/leads/${lead.id}`} key={lead.id}>
                      <div className={styles.rowMain}>
                        <h3 className={styles.rowTitle}>{leadName(lead)}</h3>
                        <p className={styles.rowDescription}>{lead.companyName || "Company not provided"} / {lead.email}</p>
                      </div>
                      <span className={styles.status}>{lead.status.toLowerCase().replaceAll("_", " ")}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Operating principles</h2>
                <p className={styles.panelHint}>The UI reflects the backend’s ownership boundaries.</p>
              </div>
            </div>
            <div className={styles.panelBody}>
              <div className={styles.principleList}>
                <div>
                  <span className={styles.principleMark}>01</span>
                  <div><strong>Evidence before action</strong><p>Recommendations and corrections expose their source before an operator decides.</p></div>
                </div>
                <div>
                  <span className={styles.principleMark}>02</span>
                  <div><strong>Backend owns policy</strong><p>Pricing, permissions, validation, idempotency, and final writes stay server-side.</p></div>
                </div>
                <div>
                  <span className={styles.principleMark}>03</span>
                  <div><strong>Human approval stays visible</strong><p>Uncertain or consequential actions are presented as decisions, not silent automation.</p></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
