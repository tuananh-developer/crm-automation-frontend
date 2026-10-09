"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Clock3,
  Edit3,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  User,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreBadge } from "@/components/leads/ScoreBadge";
import { LeadStatusBadge } from "@/components/leads/LeadStatusBadge";
import { EnrichmentCard } from "@/components/leads/EnrichmentCard";
import { LeadScoreCard } from "@/components/leads/LeadScoreCard";
import { AiQualificationCard } from "@/components/leads/AiQualificationCard";
import { ConvertLeadModal } from "@/components/leads/ConvertLeadModal";
import { EditLeadModal } from "@/components/leads/EditLeadModal";
import { LeadActiveSequencesWidget } from "@/components/follow-ups/LeadActiveSequencesWidget";
import { LeadEnrollmentModal } from "@/components/follow-ups/LeadEnrollmentModal";
import { leadService } from "@/services/lead.service";

export default function LeadDetailPage() {
  const params = useParams();
  const leadId = params.id as string;
  const [isEnrollModalOpen, setIsEnrollModalOpen] = React.useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

  // 1. Fetch Lead Details
  const {
    data: lead,
    isLoading: isLeadLoading,
    error: leadError,
    refetch: refetchLead,
  } = useQuery({
    queryKey: ["lead-detail", leadId],
    queryFn: () => leadService.getLeadById(leadId),
    enabled: !!leadId,
  });

  // 2. Fetch Latest AI Enrichment (UC03)
  const {
    data: latestEnrichment,
    isLoading: isEnrichmentLoading,
    refetch: refetchEnrichment,
  } = useQuery({
    queryKey: ["lead-enrichment", leadId],
    queryFn: () => leadService.getLatestEnrichment(leadId),
    enabled: !!leadId,
  });

  // 3. Fetch Latest AI Lead Score (UC04)
  const {
    data: latestScore,
    isLoading: isScoreLoading,
    refetch: refetchScore,
  } = useQuery({
    queryKey: ["lead-score", leadId],
    queryFn: () => leadService.getLatestScore(leadId),
    enabled: !!leadId,
  });

  // 4. Fetch Score History (UC04)
  const {
    data: scoreHistory = [],
    isLoading: isHistoryLoading,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ["lead-scores-history", leadId],
    queryFn: () => leadService.getScoreHistory(leadId),
    enabled: !!leadId,
  });

  const handleRefreshAll = () => {
    refetchLead();
    refetchEnrichment();
    refetchScore();
    refetchHistory();
  };

  if (isLeadLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <Loader2 className="size-8 animate-spin text-emerald-600 mb-3" />
        <h3 className="text-base font-bold text-gray-800">
          Loading Lead Intelligence...
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Fetching firmographics, contact signals, and AI predictive scores.
        </p>
      </div>
    );
  }

  if (leadError || !lead) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <div className="rounded-full bg-red-100 p-3 text-red-600 mb-3">
          <Building2 className="size-6" />
        </div>
        <h3 className="text-base font-bold text-gray-800">Lead Not Found</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-sm">
          The requested lead (ID: {leadId}) could not be retrieved from the
          system.
        </p>
        <Button asChild size="sm" className="mt-4 text-xs">
          <Link href="/leads">Back to Leads Directory</Link>
        </Button>
      </div>
    );
  }

  const numericScore = latestScore?.score
    ? Math.round(Number(latestScore.score))
    : null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link
            href="/leads"
            className="flex items-center gap-1 font-medium hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Leads
          </Link>
          <span>/</span>
          <span className="font-semibold text-gray-700">
            {lead.companyName}
          </span>
          <span>/</span>
          <span className="text-gray-900 font-bold">
            {lead.firstName} {lead.lastName}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            className="h-8 gap-1 text-xs"
          >
            <RefreshCw className="size-3.5" />
            Refresh Intelligence
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            className="h-8 gap-1 text-xs"
          >
            <Edit3 className="size-3.5 text-gray-500" />
            Edit Lead
          </Button>

          {/* UC08 Convert to Customer CTA if Qualified */}
          {lead.status === "QUALIFIED" && (
            <Button
              type="button"
              size="sm"
              onClick={() => setIsConvertModalOpen(true)}
              className="h-8 gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-semibold text-xs shadow-xs"
            >
              <UserCheck className="size-3.5" />
              Convert to Customer (UC08)
            </Button>
          )}

          {/* Enroll in Sequence CTA Button */}
          <Button
            type="button"
            size="sm"
            onClick={() => setIsEnrollModalOpen(true)}
            className="h-8 gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs shadow-2xs"
          >
            <UserPlus className="size-3.5" />
            Enroll in Sequence
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-gray-700 hover:text-gray-900 font-medium text-xs"
          >
            <Link href="/follow-ups">
              <Clock3 className="size-3.5 text-gray-400" />
              All Cadences
            </Link>
          </Button>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="rounded-2xl border border-[#e2e8e4] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-xl font-black text-white shadow-sm">
              {lead.firstName.charAt(0)}
              {lead.lastName.charAt(0)}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold text-gray-900">
                  {lead.firstName} {lead.lastName}
                </h1>
                <LeadStatusBadge status={lead.status} />
                {numericScore !== null && (
                  <ScoreBadge
                    score={numericScore}
                    label={latestScore?.label}
                    size="md"
                  />
                )}
              </div>

              <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span>{lead.jobTitle || "Business Lead"}</span>
                <span className="text-gray-300">·</span>
                <span className="flex items-center gap-1 text-gray-800">
                  <Building2 className="size-3.5 text-gray-400" />
                  {lead.companyName}
                </span>
                {lead.industry && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs font-medium text-gray-500">
                      {lead.industry}
                    </span>
                  </>
                )}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                <span className="flex items-center gap-1.5">
                  <Mail className="size-3.5 text-gray-400" />
                  {lead.email}
                </span>
                {lead.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="size-3.5 text-gray-400" />
                    {lead.phone}
                  </span>
                )}
                {lead.owner && (
                  <span className="flex items-center gap-1.5">
                    <User className="size-3.5 text-gray-400" />
                    Owner: {lead.owner.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FE-07 UC05: Active Follow-up Cadences & Sequences Widget */}
      <LeadActiveSequencesWidget lead={lead} />

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column: Enrichment Card (UC03) & Basic Profile */}
        <div className="space-y-6">
          <EnrichmentCard
            lead={lead}
            enrichment={latestEnrichment || null}
            isLoading={isEnrichmentLoading}
          />

          {/* Lead Details & Notes Card */}
          <Card className="border border-[#e2e8e4] bg-white shadow-sm">
            <CardHeader className="border-b border-[#edf0ee] px-6 py-4">
              <CardTitle className="text-sm font-bold text-gray-900">
                Lead Source &amp; CRM Context
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold text-gray-400 uppercase text-[10px]">
                    Acquisition Channel
                  </span>
                  <p className="mt-1 font-semibold text-gray-900">
                    {lead.source?.name || "Direct / Webform"}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-gray-400 uppercase text-[10px]">
                    Created At
                  </span>
                  <p className="mt-1 text-gray-700">
                    {new Date(lead.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {lead.notes && (
                <div className="border-t border-gray-100 pt-3">
                  <span className="font-semibold text-gray-400 uppercase text-[10px]">
                    Internal Notes
                  </span>
                  <p className="mt-1 text-gray-700 italic bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    &ldquo;{lead.notes}&rdquo;
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: AI Lead Qualification (UC02) & Scoring Card (UC04) */}
        <div className="space-y-6">
          <AiQualificationCard lead={lead} onRefresh={handleRefreshAll} />

          <LeadScoreCard
            lead={lead}
            latestScore={latestScore || null}
            historyScores={scoreHistory}
            isLoading={isScoreLoading || isHistoryLoading}
          />
        </div>
      </div>

      {/* Enroll in Sequence Modal */}
      <LeadEnrollmentModal
        lead={lead}
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
      />

      {/* Convert to Customer Modal (UC08) */}
      <ConvertLeadModal
        lead={lead}
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        onSuccess={() => handleRefreshAll()}
      />

      {/* Edit Lead Modal */}
      <EditLeadModal
        lead={lead}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => handleRefreshAll()}
      />
    </div>
  );
}
