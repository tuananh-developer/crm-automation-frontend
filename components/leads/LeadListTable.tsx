"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Edit3,
  Mail,
  Plus,
  Search,
  Tag,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "@/components/leads/ScoreBadge";
import { LeadStatusBadge } from "@/components/leads/LeadStatusBadge";
import { LeadEnrollmentModal } from "@/components/follow-ups/LeadEnrollmentModal";
import { CreateLeadModal } from "@/components/leads/CreateLeadModal";
import { EditLeadModal } from "@/components/leads/EditLeadModal";
import { leadService } from "@/services/lead.service";
import type { Lead, LeadScore } from "@/types/lead";

interface LeadListTableProps {
  leads: Lead[];
  scoresMap?: Record<string, LeadScore>;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function LeadListTable({
  leads,
  scoresMap = {},
  isLoading = false,
  onRefresh,
}: LeadListTableProps) {
  // Filters state
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [tierFilter, setTierFilter] = React.useState<string>("ALL");
  const [sourceFilter, setSourceFilter] = React.useState<string>("ALL");

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [leadToEdit, setLeadToEdit] = React.useState<Lead | null>(null);
  const [leadToEnroll, setLeadToEnroll] = React.useState<Lead | null>(null);

  // Fetch sources for filtering
  const { data: sources = [] } = useQuery({
    queryKey: ["lead-sources"],
    queryFn: () => leadService.getLeadSources(),
  });

  // Filtered leads
  const filteredLeads = React.useMemo(() => {
    return leads.filter((lead) => {
      // Search text
      if (search.trim()) {
        const query = search.toLowerCase();
        const fullName = `${lead.firstName} ${lead.lastName}`.toLowerCase();
        const company = (lead.companyName || "").toLowerCase();
        const email = (lead.email || "").toLowerCase();
        const industry = (lead.industry || "").toLowerCase();
        const phone = (lead.phone || "").toLowerCase();

        if (
          !fullName.includes(query) &&
          !company.includes(query) &&
          !email.includes(query) &&
          !industry.includes(query) &&
          !phone.includes(query)
        ) {
          return false;
        }
      }

      // Status Filter
      if (statusFilter !== "ALL" && lead.status !== statusFilter) {
        return false;
      }

      // Source Filter
      if (sourceFilter !== "ALL" && lead.sourceId !== sourceFilter) {
        return false;
      }

      // AI Tier Filter
      if (tierFilter !== "ALL") {
        const score = scoresMap[lead.id];
        const num = score ? Number(score.score) : 0;
        const label =
          score?.label || (num >= 70 ? "HOT" : num >= 40 ? "WARM" : "COLD");
        if (label !== tierFilter) {
          return false;
        }
      }

      return true;
    });
  }, [leads, scoresMap, search, statusFilter, tierFilter, sourceFilter]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  const handleTierChange = (val: string) => {
    setTierFilter(val);
    setCurrentPage(1);
  };

  const handleSourceChange = (val: string) => {
    setSourceFilter(val);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setTierFilter("ALL");
    setSourceFilter("ALL");
    setCurrentPage(1);
  };

  // Paginated slice
  const totalItems = filteredLeads.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedLeads = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, currentPage, pageSize]);

  const hasActiveFilters =
    Boolean(search) ||
    statusFilter !== "ALL" ||
    tierFilter !== "ALL" ||
    sourceFilter !== "ALL";

  return (
    <div className="space-y-4">
      {/* Search, Filters, and Action Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#e2e8e4] bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search leads by name, email, company, industry..."
              className="pl-9 h-9 text-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Filters Group */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 shadow-2xs hover:border-gray-300 focus:outline-hidden"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="QUALIFYING">Qualifying</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="CONTACTED">Contacted</option>
              <option value="PROPOSAL_SENT">Proposal Sent</option>
              <option value="NEGOTIATING">Negotiating</option>
              <option value="CONVERTED">Converted</option>
              <option value="LOST">Lost</option>
            </select>

            {/* AI Tier Filter */}
            <select
              value={tierFilter}
              onChange={(e) => handleTierChange(e.target.value)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 shadow-2xs hover:border-gray-300 focus:outline-hidden"
            >
              <option value="ALL">All AI Scores</option>
              <option value="HOT">🔥 HOT (≥ 70)</option>
              <option value="WARM">⚡ WARM (40-69)</option>
              <option value="COLD">❄️ COLD (&lt; 40)</option>
            </select>

            {/* Source Filter */}
            {sources.length > 0 && (
              <select
                value={sourceFilter}
                onChange={(e) => handleSourceChange(e.target.value)}
                className="h-9 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 shadow-2xs hover:border-gray-300 focus:outline-hidden"
              >
                <option value="ALL">All Sources</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 text-xs text-gray-500 hover:text-gray-900"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Primary Action Button: Create Lead */}
        <div className="flex items-center gap-2 justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100">
          <Button
            onClick={() => setIsCreateOpen(true)}
            size="sm"
            className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm gap-1.5"
          >
            <Plus className="size-4" />
            Create Lead
          </Button>
        </div>
      </div>

      {/* Leads Table Container */}
      <div className="overflow-hidden rounded-2xl border border-[#e2e8e4] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#edf0ee] bg-gray-50/70 text-gray-500">
              <tr>
                <th className="py-3 px-5 font-semibold">Lead Contact</th>
                <th className="py-3 px-5 font-semibold">Company &amp; Industry</th>
                <th className="py-3 px-5 font-semibold">Source</th>
                <th className="py-3 px-5 font-semibold">Status</th>
                <th className="py-3 px-5 font-semibold">AI Score (UC04)</th>
                <th className="py-3 px-5 font-semibold">Enrichment (UC03)</th>
                <th className="py-3 px-5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf0ee] text-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="size-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                      <span>Loading leads database...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <Filter className="size-8 text-gray-300" />
                      <p className="font-semibold text-gray-700">No matching leads found</p>
                      <p className="text-xs text-gray-400">
                        {hasActiveFilters
                          ? "Try clearing your search or adjusting the filters above."
                          : "No leads are currently enrolled in the CRM. Click '+ Create Lead' to add your first prospect."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead) => {
                  const score = scoresMap[lead.id];
                  const hasEnrichment = !!lead.companySize || !!lead.industry;

                  return (
                    <tr
                      key={lead.id}
                      className="group transition-colors hover:bg-gray-50/80"
                    >
                      {/* Contact Column */}
                      <td className="py-3.5 px-5">
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
                      <td className="py-3.5 px-5">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 flex items-center gap-1.5">
                            <Building2 className="size-3.5 text-gray-400" />
                            {lead.companyName}
                          </span>
                          <span className="text-[11px] text-gray-500 mt-0.5">
                            {lead.industry || "General Industry"}
                          </span>
                          {lead.companySize ? (
                            <span className="text-[10px] text-gray-400">
                              {lead.companySize} employees
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Source Column */}
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                          <Tag className="size-2.5 text-gray-500" />
                          {lead.source?.name || "Direct Web"}
                        </span>
                      </td>

                      {/* Status Column */}
                      <td className="py-3.5 px-5">
                        <LeadStatusBadge status={lead.status} />
                      </td>

                      {/* AI Score Column */}
                      <td className="py-3.5 px-5">
                        {score ? (
                          <ScoreBadge
                            score={score.score}
                            label={score.label}
                            size="md"
                          />
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">
                            Unscored
                          </span>
                        )}
                      </td>

                      {/* Enrichment Status Column */}
                      <td className="py-3.5 px-5">
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
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Edit */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setLeadToEdit(lead)}
                            className="size-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                            title="Edit Lead Details"
                          >
                            <Edit3 className="size-3.5" />
                          </Button>

                          {/* Enroll */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setLeadToEnroll(lead)}
                            className="h-7 gap-1 text-[11px] font-semibold text-emerald-800 border-emerald-200 hover:bg-emerald-50 px-2"
                            title="Enroll in follow-up sequence"
                          >
                            <Clock className="size-3 text-emerald-600" />
                            Enroll
                          </Button>

                          {/* View Detail Link */}
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-2"
                          >
                            <Link href={`/leads/${lead.id}`}>
                              Intelligence
                              <ArrowRight className="size-3" />
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

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[#edf0ee] bg-gray-50/50 px-5 py-3 text-xs text-gray-500 gap-3">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-7 rounded-md border border-gray-200 bg-white px-2 text-xs font-medium text-gray-700"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>
              leads per page (Showing {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{" "}
              {Math.min(currentPage * pageSize, totalItems)} of {totalItems})
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-7 px-2 text-xs"
            >
              <ChevronLeft className="size-3.5 mr-0.5" />
              Previous
            </Button>
            <span className="px-2 font-medium text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 px-2 text-xs"
            >
              Next
              <ChevronRight className="size-3.5 ml-0.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Create Lead Modal */}
      <CreateLeadModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />

      {/* Edit Lead Modal */}
      {leadToEdit && (
        <EditLeadModal
          lead={leadToEdit}
          isOpen={Boolean(leadToEdit)}
          onClose={() => setLeadToEdit(null)}
          onSuccess={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}

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
