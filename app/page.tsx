"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowUpRight, BadgeCheck, BrainCircuit, ClipboardCheck, FileText, ScanSearch, Users, Workflow } from "lucide-react";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { leadService } from "@/services/lead.service";
import { getReviewTasks } from "@/services/review.service";
import { getApiErrorMessage } from "@/services/api-client";
import type { Lead } from "@/types/lead";
import styles from "@/components/workspace/workspace.module.css";

const workstreams = [
  { code: "T12 / WF01", title: "Lead qualification", description: "Evaluate sales readiness, inspect model confidence, and route uncertain records to human review.", href: "/qualification", icon: BadgeCheck, state: "Lead intelligence" },
  { code: "T12 / WF08", title: "Data cleaning", description: "Scan CRM records, compare proposed corrections, then approve only the changes worth writing back.", href: "/data-cleaning", icon: ScanSearch, state: "Quality control" },
  { code: "T12 / WF10", title: "Next best action", description: "Request evidence-backed recommendations for a Lead or Customer. Approval stays with the operator.", href: "/next-best-actions", icon: BrainCircuit, state: "Decision support" },
  { code: "T12 / WF11", title: "Sales meetings", description: "Turn a meeting transcript into a redacted summary, decisions, risks, and confirmable action items.", href: "/sales-meetings", icon: ClipboardCheck, state: "Conversation intelligence" },
  { code: "T12 / WF12", title: "Quote & proposal", description: "Build a quote from the active catalog. Backend pricing and the approval policy remain authoritative.", href: "/quotes", icon: FileText, state: "Commercial workflow" },
];

function leadName(lead: Lead) {
  return [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "Unnamed lead";
}

function leadInitials(lead: Lead) {
  return leadName(lead).split(/\s+/).map((part) => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function readableStatus(status: string) {
  return status.toLowerCase().replaceAll("_", " ");
}

export default function DashboardPage() {
  const leadsQuery = useQuery({
    queryKey: ["leads", "dashboard"],
    queryFn: () => leadService.getLeads({ limit: 100, page: 1 }),
  });
  const reviewsQuery = useQuery({ queryKey: ["review-tasks"], queryFn: getReviewTasks });
  const leads = useMemo(() => leadsQuery.data?.data ?? [], [leadsQuery.data?.data]);
  const pendingReviews = (reviewsQuery.data ?? []).filter((task) => task.status === "PENDING").length;
  const totalLeads = leadsQuery.data?.meta?.total ?? leads.length;
  const leadError = leadsQuery.isError ? getApiErrorMessage(leadsQuery.error) : null;
  const reviewError = reviewsQuery.isError ? getApiErrorMessage(reviewsQuery.error) : null;

  const statusMix = useMemo(() => {
    const counts = new Map<string, number>();
    for (const lead of leads) {
      const status = String(lead.status);
      counts.set(status, (counts.get(status) ?? 0) + 1);
    }
    const ranked = Array.from(counts.entries())
      .map(([status, count]) => ({ label: readableStatus(status), count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    const visible = ranked.slice(0, 4);
    const remaining = ranked.slice(4).reduce((sum, item) => sum + item.count, 0);
    return remaining > 0 ? [...visible, { label: "other", count: remaining }] : visible;
  }, [leads]);

  return (
    <>
      <WorkspaceHeader />
      <main id="main-content" tabIndex={-1} className={styles.screen}>
        <section className={styles.overviewHero} aria-labelledby="overview-title">
          <div className={styles.overviewHeroMain}>
            <div className={styles.overviewKicker}><Activity size={15} strokeWidth={2} aria-hidden="true" /><span>Revenue operations workspace</span></div>
            <h1 id="overview-title">Signals in.<br />Decisions out.</h1>
            <p className={styles.overviewDescription}>Turn lead intelligence, AI recommendations, and commercial intent into decisions your team can review.</p>
            <div className={styles.overviewActions}>
              <Link className={styles.overviewPrimaryLink} href="/leads">Open lead pipeline <ArrowUpRight size={16} aria-hidden="true" /></Link>
              <Link className={styles.overviewSecondaryLink} href="/review">Review queue <ClipboardCheck size={15} aria-hidden="true" /></Link>
            </div>
          </div>
          <aside className={styles.overviewHeroMetrics} aria-label="Current CRM overview">
            <div className={styles.overviewLeadMetric}>
              <span className={styles.overviewMetricLabel}>Lead records</span>
              <strong>{leadsQuery.isLoading || leadsQuery.isError ? "—" : totalLeads}</strong>
              <span className={styles.overviewMetricNote}>Across the current CRM scope</span>
            </div>
            <div className={styles.overviewReviewMetric}>
              <div className={styles.overviewReviewIcon}><ClipboardCheck size={18} aria-hidden="true" /></div>
              <div className={styles.overviewReviewCopy}>
                <span>Awaiting human review</span>
                <strong>{reviewsQuery.isLoading || reviewsQuery.isError ? "—" : pendingReviews}</strong>
              </div>
              <Link href="/review" aria-label="Open the review queue"><ArrowUpRight size={17} aria-hidden="true" /></Link>
            </div>
            <div className={styles.overviewHeroFoot}><Workflow size={14} aria-hidden="true" /><span>Five specialist workbenches</span></div>
          </aside>
        </section>

        {(leadError || reviewError) && (
          <div className={styles.errorPanel} role="alert">
            <strong>Part of the workspace could not be loaded.</strong>
            <span>{[leadError, reviewError].filter(Boolean).join(" / ")}</span>
          </div>
        )}

        <div className={styles.overviewSectionHead}>
          <div>
            <h2 className={styles.sectionTitle}>Choose your workbench</h2>
            <p className={styles.sectionDescription}>Five focused workflows for the decision in front of you.</p>
          </div>
          <span className={styles.overviewSectionMeta}>T12 · owned workflows</span>
        </div>

        <section className={styles.workbenchGrid} aria-label="Owned workflows">
          {workstreams.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link className={styles.workbenchCard} data-featured={index === 0 ? "true" : "false"} href={item.href} key={item.code}>
                <div className={styles.workbenchCardTop}>
                  <span>{item.code}</span>
                  <span className={styles.workbenchCardIcon}><Icon size={21} strokeWidth={1.8} aria-hidden="true" /></span>
                </div>
                <div className={styles.workbenchCardBody}>
                  <span className={styles.workbenchCardIndex}>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                <div className={styles.workbenchCardFoot}><span>{item.state}</span><ArrowUpRight size={17} aria-hidden="true" /></div>
              </Link>
            );
          })}
        </section>

        <section className={styles.overviewPanels}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div><h2 className={styles.panelTitle}>Latest leads</h2><p className={styles.panelHint}>A quick path back to the records driving the work.</p></div>
              <Link className={styles.inlineLink} href="/leads">View pipeline <ArrowUpRight size={14} aria-hidden="true" /></Link>
            </div>
            <div className={styles.panelBody}>
              {leadsQuery.isLoading ? (
                <div className={styles.loadingState}>Loading the current lead scope…</div>
              ) : leads.length === 0 ? (
                <div className={styles.emptyState}>
                  <Users size={22} aria-hidden="true" /><strong>No leads in this scope yet</strong>
                  <p>Create or import a lead to begin qualification and follow-up work.</p>
                  <Link className={styles.secondaryButton} href="/leads">Open leads</Link>
                </div>
              ) : (
                <div className={styles.overviewLeadList}>
                  {leads.slice(0, 5).map((lead) => (
                    <Link className={styles.overviewLeadRow} href={"/leads/" + lead.id} key={lead.id}>
                      <span className={styles.overviewLeadAvatar}>{leadInitials(lead)}</span>
                      <span className={styles.overviewLeadMain}>
                        <strong>{leadName(lead)}</strong>
                        <small>{lead.companyName || "Company not provided"} · {lead.email}</small>
                      </span>
                      <span className={styles.overviewLeadStatus}>{readableStatus(lead.status)}</span>
                      <ArrowUpRight className={styles.overviewLeadArrow} size={15} aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div><h2 className={styles.panelTitle}>Lead status mix</h2><p className={styles.panelHint}>A live view of the records loaded into this workspace.</p></div>
              <span className={styles.overviewSampleCount}>{leadsQuery.isLoading ? "—" : leads.length} loaded</span>
            </div>
            <div className={styles.panelBody}>
              {leadsQuery.isLoading ? (
                <div className={styles.loadingState}>Preparing the status distribution…</div>
              ) : leads.length === 0 ? (
                <div className={styles.overviewChartEmpty}>Status distribution appears when leads are available.</div>
              ) : (
                <>
                  <div
                    className={styles.statusMixBar}
                    role="img"
                    aria-label={"Status distribution across " + leads.length + " loaded lead records: " + statusMix.map((item) => item.label + ": " + item.count).join(", ")}
                  >
                    {statusMix.map((item, index) => (
                      <span className={styles.statusMixSegment} data-tone={index} key={item.label}
                        style={{ width: ((item.count / leads.length) * 100) + "%" }}
                        title={item.label + ": " + item.count} />
                    ))}
                  </div>
                  <div className={styles.statusMixLegend}>
                    {statusMix.map((item, index) => (
                      <div className={styles.statusMixRow} key={item.label}>
                        <span className={styles.statusMixSwatch} data-tone={index} aria-hidden="true" />
                        <span className={styles.statusMixName}>{item.label}</span>
                        <strong>{item.count}</strong>
                        <span className={styles.statusMixPercent}>{Math.round((item.count / leads.length) * 100)}%</span>
                      </div>
                    ))}
                  </div>
                  {totalLeads > leads.length && (
                    <p className={styles.statusMixFoot}>Distribution uses the first {leads.length} loaded records out of {totalLeads} total.</p>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        <section className={styles.overviewPrinciples} aria-labelledby="principles-title">
          <div className={styles.overviewPrinciplesHead}>
            <h2 id="principles-title" className={styles.sectionTitle}>Operating principles</h2>
            <span className={styles.overviewSectionMeta}>Built around accountable automation</span>
          </div>
          <div className={styles.overviewPrincipleGrid}>
            <div><span>Evidence</span><strong>Evidence before action</strong><p>Recommendations and corrections expose their source before an operator decides.</p></div>
            <div><span>Policy</span><strong>Backend owns policy</strong><p>Pricing, permissions, validation, idempotency, and final writes stay server-side.</p></div>
            <div><span>People</span><strong>Human approval stays visible</strong><p>Uncertain or consequential actions are presented as decisions, not silent automation.</p></div>
          </div>
        </section>
      </main>
    </>
  );
}
