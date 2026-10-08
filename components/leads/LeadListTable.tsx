"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Mail,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "@/components/leads/ScoreBadge";
import { LeadStatusBadge } from "@/components/leads/LeadStatusBadge";
import { LeadEnrollmentModal } from "@/components/follow-ups/LeadEnrollmentModal";
import type { Lead, LeadScore } from "@/types/lead";

interface LeadListTableProps {
  leads: Lead[];
  scoresMap?: Record<string, LeadScore>;
  isLoading?: boolean;
}

export function LeadListTable({
  leads,
  scoresMap = {},
  isLoading = false,
}: LeadListTableProps) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [tierFilter, setTierFilter] = React.useState<string>("ALL");
  const [leadToEnroll, setLeadToEnroll] = React.useState<Lead | null>(null);

  const filteredLeads = React.useMemo(() => {
    return leads.filter((lead) => {
      // Search text
      if (search.trim()) {
        const query = search.toLowerCase();
        const fullName = `${lead.firstName} ${lead.lastName}`.toLowerCase();
        const company = (lead.companyName || "").toLowerCase();
        const email = (lead.email || "").toLowerCase();
        const industry = (lead.industry || "").toLowerCase();

        if (
          !fullName.includes(query) &&
          !company.includes(query) &&
          !email.includes(query) &&
          !industry.includes(query)
        ) {
          return false;
        }
      }

      // Status Filter
      if (statusFilter !== "ALL" && lead.status !== statusFilter) {
        return false;
      }

      // Tier Filter
      if (tierFilter !== "ALL") {
        const score = scoresMap[lead.id];
        const num = score ? Number(score.score) : 0;
        const label = score?.label || (num >= 75 ? "HOT" : num >= 50 ? "WARM" : "COLD");
        if (label !== tierFilter) {
          return false;
        }
      }

      return true;
    });
  }, [leads, scoresMap, search, statusFilter, tierFilter]);

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#e2e8e4] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, company, email, or industry..."
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 shadow-2xs hover:border-gray-300 focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="QUALIFYING">Qualifying</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="CONTACTED">Contacted</option>
            <option value="LOST">Lost</option>
          </select>

          {/* AI Score Tier Filter */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 shadow-2xs hover:border-gray-300 focus:outline-hidden"
          >
            <option value="ALL">All AI Tiers</option>
            <option value="HOT">🔥 HOT (≥ 75)</option>
            <option value="WARM">⚡ WARM (50-74)</option>
            <option value="COLD">❄️ COLD (&lt; 50)</option>
          </select>

          {(search || statusFilter !== "ALL" || tierFilter !== "ALL") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
                setTierFilter("ALL");
              }}
              className="h-9 text-xs text-gray-500 hover:text-gray-900"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-2xl border border-[#e2e8e4] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#edf0ee] bg-gray-50/70 text-gray-500">
              <tr>
                <th className="py-3 px-5 font-semibold">Lead Contact</th>
                <th className="py-3 px-5 font-semibold">Company &amp; Industry</th>
                <th className="py-3 px-5 font-semibold">Status</th>
                <th className="py-3 px-5 font-semibold">AI Lead Score (UC04)</th>
                <th className="py-3 px-5 font-semibold">Enrichment (UC03)</th>
                <th className="py-3 px-5 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf0ee] text-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Loading leads data...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No leads match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const score = scoresMap[lead.id];
                  const hasEnrichment = !!lead.companySize || !!lead.industry;

                  return (
                    <tr
                      key={lead.id}
                      className="group transition-colors hover:bg-gray-50/80"
                    >
                      {/* Contact Column */}
                      <td className="py-4 px-5">
                        <div className="flex flex-col">
                          <Link
                            href={`/leads/${lead.id}`}
                            className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors"
                          >
                            {lead.firstName} {lead.lastName}
                          </Link>
                          <span className="text-[11px] text-gray-500">
                            {lead.jobTitle || "Business Lead"}
                          </span>
                          <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <Mail className="size-3" />
                            {lead.email}
                          </span>
                        </div>
                      </td>

                      {/* Company Column */}
                      <td className="py-4 px-5">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 flex items-center gap-1.5">
                            <Building2 className="size-3.5 text-gray-400" />
                            {lead.companyName}
                          </span>
                          <span className="text-[11px] text-gray-500 mt-0.5">
                            {lead.industry || "General Industry"}
                          </span>
                          {lead.companySize && (
                            <span className="text-[10px] text-gray-400">
                              {lead.companySize} employees
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="py-4 px-5">
                        <LeadStatusBadge status={lead.status} />
                      </td>

                      {/* AI Score Column */}
                      <td className="py-4 px-5">
                        {score ? (
                          <div className="flex items-center gap-2">
                            <ScoreBadge
                              score={score.score}
                              label={score.label}
                              size="md"
                            />
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">
                            Unscored
                          </span>
                        )}
                      </td>

                      {/* Enrichment Status Column */}
                      <td className="py-4 px-5">
                        {hasEnrichment ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-100">
                            <CheckCircle2 className="size-3" />
                            Enriched
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                            Basic
                          </span>
                        )}
                      </td>

                      {/* Action Column */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setLeadToEnroll(lead)}
                            className="h-8 gap-1 text-xs font-semibold text-emerald-800 border-emerald-200 hover:bg-emerald-50"
                            title="Enroll in follow-up sequence"
                          >
                            <Clock className="size-3 text-emerald-600" />
                            Enroll
                          </Button>

                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                          >
                            <Link href={`/leads/${lead.id}`}>
                              View Intelligence
                              <ArrowRight className="size-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enroll in Sequence Modal */}
      {leadToEnroll && (
        <LeadEnrollmentModal
          lead={leadToEnroll}
          isOpen={Boolean(leadToEnroll)}
          onClose={() => setLeadToEnroll(null)}
        />
      )}

    </div>
  );
}
