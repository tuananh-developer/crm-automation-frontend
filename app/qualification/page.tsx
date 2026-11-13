"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, UserRoundSearch } from "lucide-react";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { AiQualificationCard } from "@/components/leads/AiQualificationCard";
import { LeadStatusBadge } from "@/components/leads/LeadStatusBadge";
import { leadService } from "@/services/lead.service";
import { getApiErrorMessage } from "@/services/api-client";
import type { Lead } from "@/types/lead";
import styles from "@/components/workspace/workspace.module.css";

function displayName(lead: Lead) {
  return [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "Unnamed lead";
}

export default function QualificationPage() {
  const [search, setSearch] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const leadsQuery = useQuery({
    queryKey: ["leads", "qualification-workbench"],
    queryFn: () => leadService.getLeads({ limit: 100, page: 1 }),
  });
  const leads = useMemo(() => leadsQuery.data?.data ?? [], [leadsQuery.data?.data]);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return leads;
    return leads.filter((lead) =>
      [displayName(lead), lead.companyName, lead.email, lead.industry ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [leads, search]);
  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) ?? filtered[0] ?? null;

  return (
    <>
      <WorkspaceHeader />
      <main id="main-content" tabIndex={-1} className={styles.screen}>
        <header className={styles.screenHead}>
          <div className={styles.screenHeadCopy}>
            <h1 className={styles.screenTitle}>Qualification desk.</h1>
            <p className={styles.screenDescription}>
              Choose a lead, review its evidence, and decide whether it qualifies.
            </p>
          </div>
          <div className={styles.headMetric}>
            <span className={styles.meta}>Current scope</span>
            <strong>{leadsQuery.isLoading ? "—" : leadsQuery.data?.meta?.total ?? leads.length}</strong>
            <span>lead records</span>
          </div>
        </header>

        {leadsQuery.isError && (
          <div className={styles.errorPanel} role="alert">{getApiErrorMessage(leadsQuery.error)}</div>
        )}

        <div className={styles.twoColumn}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Lead queue</h2>
                <p className={styles.panelHint}>Select a record to inspect or reassess.</p>
              </div>
            </div>
            <div className={styles.panelBody}>
              <label className={styles.searchField}>
                <Search size={16} aria-hidden="true" />
                <input
                  className={styles.textInput}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, company, email"
                  aria-label="Search leads"
                />
              </label>
              {leadsQuery.isLoading ? (
                <div className={styles.loadingState}>Loading leads…</div>
              ) : filtered.length === 0 ? (
                <div className={styles.emptyState}>
                  <UserRoundSearch size={22} />
                  <strong>No matching lead</strong>
                  <p>Change the search term or add a lead in the pipeline.</p>
                </div>
              ) : (
                <div className={styles.leadQueue}>
                  {filtered.map((lead) => (
                    <button
                      type="button"
                      key={lead.id}
                      onClick={() => setSelectedLeadId(lead.id)}
                      className={lead.id === selectedLead?.id ? styles.leadQueueItemActive : styles.leadQueueItem}
                      aria-pressed={lead.id === selectedLead?.id}
                    >
                      <span className={styles.queueInitial}>{displayName(lead).slice(0, 1).toUpperCase()}</span>
                      <span className={styles.queueCopy}>
                        <strong>{displayName(lead)}</strong>
                        <small>{lead.companyName || "Company not provided"}</small>
                      </span>
                      <LeadStatusBadge status={lead.status} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className={styles.qualificationDetail}>
            {selectedLead ? (
              <>
                <div className={styles.selectedRecord}>
                  <div>
                    <span className={styles.meta}>Selected record</span>
                    <h2>{displayName(selectedLead)}</h2>
                    <p>{selectedLead.companyName || "Company not provided"} / {selectedLead.email}</p>
                  </div>
                  <LeadStatusBadge status={selectedLead.status} />
                </div>
                <AiQualificationCard key={selectedLead.id} lead={selectedLead} />
              </>
            ) : (
              <div className={styles.panel}>
                <div className={styles.emptyState}>
                  <UserRoundSearch size={24} />
                  <strong>Select a lead to begin</strong>
                  <p>The qualification result and action history will appear here.</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
