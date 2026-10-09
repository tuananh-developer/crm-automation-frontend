"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  ExternalLink,
  Globe,
  Loader2,
  RefreshCw,
  Sparkles,
  Users2,
  Briefcase,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { leadService } from "@/services/lead.service";
import { getApiErrorMessage } from "@/services/api-client";
import type { Lead, LeadEnrichment } from "@/types/lead";
import { cn } from "@/lib/utils";

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

interface EnrichmentCardProps {
  lead: Lead;
  enrichment: LeadEnrichment | null;
  isLoading?: boolean;
}

export function EnrichmentCard({
  lead,
  enrichment,
  isLoading = false,
}: EnrichmentCardProps) {
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = React.useState<string>("mock");
  const [feedbackMessage, setFeedbackMessage] = React.useState<string | null>(null);

  const enrichMutation = useMutation({
    mutationFn: (provider: string) =>
      leadService.triggerEnrichment(lead.id, { provider }),
    onSuccess: (data) => {
      setFeedbackMessage(data.message || "Enrichment completed successfully!");
      queryClient.invalidateQueries({ queryKey: ["lead-enrichment", lead.id] });
      queryClient.invalidateQueries({ queryKey: ["lead-detail", lead.id] });
      setTimeout(() => setFeedbackMessage(null), 5000);
    },
    onError: (err: unknown) => {
      const msg = getApiErrorMessage(err);
      setFeedbackMessage(`Error: ${msg}`);
      setTimeout(() => setFeedbackMessage(null), 6000);
    },
  });

  const handleReTrigger = () => {
    enrichMutation.mutate(selectedProvider);
  };

  // Helper values falling back from enrichment to lead basic profile
  const companyName = enrichment?.companyName || lead.companyName;
  const companyWebsite = enrichment?.companyWebsite || lead.companyWebsite;
  const industry = enrichment?.companyIndustry || lead.industry;
  const companySize = enrichment?.companySize || lead.companySize;
  const jobTitle = enrichment?.contactJobTitle || lead.jobTitle;

  const raw = (enrichment?.rawResponse || {}) as Record<string, unknown>;
  const rawCompany = (raw.company || {}) as Record<string, unknown>;
  const linkedinUrl =
    enrichment?.contactLinkedinUrl ||
    (rawCompany.linkedinUrl as string) ||
    (rawCompany.linkedin as string) ||
    null;

  const location =
    (rawCompany.location as string) ||
    (raw.location as string) ||
    (rawCompany.geo as string) ||
    null;
  const foundedYear =
    (rawCompany.foundedYear as number) ||
    (raw.foundedYear as number) ||
    null;

  const dateStr = enrichment?.enrichedAt || enrichment?.createdAt;
  let formattedEnrichedAt: string | null = null;
  if (dateStr) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const pad = (n: number) => n.toString().padStart(2, "0");
      const day = pad(d.getDate());
      const month = pad(d.getMonth() + 1);
      const year = d.getFullYear();
      const hours = pad(d.getHours());
      const minutes = pad(d.getMinutes());
      formattedEnrichedAt = `${day}/${month}/${year} ${hours}:${minutes}`;
    }
  }

  return (
    <Card className="overflow-hidden border border-[#e2e8e4] bg-white shadow-sm">
      <CardHeader className="flex flex-col gap-3 border-b border-[#edf0ee] bg-gradient-to-r from-emerald-50/40 via-white to-transparent px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700">
            <Sparkles className="size-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold text-gray-900">
                Company &amp; Contact Intelligence
              </CardTitle>
              {enrichment && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase",
                    enrichment.status === "SUCCESS" &&
                      "bg-emerald-100/70 text-emerald-800",
                    enrichment.status === "PENDING" &&
                      "bg-amber-100 text-amber-800",
                    enrichment.status === "PARTIAL" &&
                      "bg-sky-100 text-sky-800",
                    enrichment.status === "FAILED" && "bg-red-100 text-red-800",
                  )}
                >
                  {enrichment.status === "SUCCESS" && (
                    <CheckCircle2 className="size-3" />
                  )}
                  {enrichment.status === "PENDING" && (
                    <Clock className="size-3 animate-spin" />
                  )}
                  {enrichment.status === "FAILED" && (
                    <AlertCircle className="size-3" />
                  )}
                  {enrichment.status}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              AI-driven multi-source profile enrichment (Backend UC03)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            disabled={enrichMutation.isPending}
            className="h-8 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 shadow-2xs hover:border-gray-300 focus:border-emerald-500 focus:outline-hidden"
          >
            <option value="mock">Provider: Mock AI</option>
            <option value="clearbit">Provider: Clearbit</option>
            <option value="apollo">Provider: Apollo.io</option>
          </select>

          <Button
            size="sm"
            onClick={handleReTrigger}
            disabled={enrichMutation.isPending}
            className="h-8 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 font-medium text-xs shadow-2xs"
          >
            {enrichMutation.isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Enriching...
              </>
            ) : (
              <>
                <RefreshCw className="size-3.5" />
                {enrichment ? "Re-trigger Enrichment" : "Enrich Lead"}
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {feedbackMessage && (
          <div
            className={cn(
              "mb-4 flex items-center gap-2 rounded-xl p-3 text-xs font-medium transition-all",
              feedbackMessage.startsWith("Error")
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-emerald-50 text-emerald-800 border border-emerald-200",
            )}
          >
            <Sparkles className="size-4 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <Loader2 className="size-4 animate-spin text-emerald-600" />
              <span>Fetching intelligence signals...</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-xl border border-gray-100 bg-gray-50/70 p-3.5"
                />
              ))}
            </div>
          </div>
        ) : !enrichment ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-10 px-4 text-center">
            <div className="mb-3 rounded-full bg-emerald-100 p-3 text-emerald-700">
              <Building2 className="size-6" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900">
              No Enriched Profile Available
            </h4>
            <p className="mt-1 max-w-sm text-xs text-gray-500">
              Run automated AI enrichment to discover company headcounts,
              industry taxonomy, LinkedIn profiles, and verified contact roles.
            </p>
            <Button
              size="sm"
              onClick={handleReTrigger}
              disabled={enrichMutation.isPending}
              className="mt-4 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 text-xs"
            >
              {enrichMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              Enrich this lead
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Company Profile Details Grid */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Company Architecture
                </span>
                <div className="flex items-center gap-2">
                  <Badge tone="neutral" className="text-[11px] font-medium bg-emerald-50 text-emerald-800 border-emerald-200">
                    Enriched by {enrichment?.provider ? enrichment.provider.toUpperCase() : "AI"}
                  </Badge>
                  {formattedEnrichedAt && (
                    <span className="text-[11px] text-gray-500 font-medium">
                      {formattedEnrichedAt}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Company Name */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3.5 transition-colors hover:bg-gray-50">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Building2 className="size-3.5 text-gray-400" />
                    <span>Company Name</span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-gray-900">
                    {companyName || "N/A"}
                  </p>
                </div>

                {/* Industry */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3.5 transition-colors hover:bg-gray-50">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Briefcase className="size-3.5 text-gray-400" />
                    <span>Industry Sector</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {industry ? (
                      <span className="inline-block rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-100 shadow-2xs">
                        {industry}
                      </span>
                    ) : (
                      "Not classified"
                    )}
                  </p>
                </div>

                {/* Company Size */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3.5 transition-colors hover:bg-gray-50">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Users2 className="size-3.5 text-gray-400" />
                    <span>Company Size</span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-gray-900">
                    {companySize ? (
                      <span className="font-semibold">
                        {companySize.toLocaleString()}{" "}
                        <span className="text-xs font-normal text-gray-500">
                          employees
                        </span>
                      </span>
                    ) : (
                      "Unknown size"
                    )}
                  </p>
                </div>

                {/* Website Link */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3.5 transition-colors hover:bg-gray-50">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Globe className="size-3.5 text-gray-400" />
                    <span>Website</span>
                  </div>
                  <div className="mt-1">
                    {companyWebsite ? (
                      <a
                        href={
                          companyWebsite.startsWith("http")
                            ? companyWebsite
                            : `https://${companyWebsite}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                      >
                        <span className="truncate max-w-[180px]">
                          {companyWebsite.replace(/^https?:\/\//, "")}
                        </span>
                        <ExternalLink className="size-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">Not provided</span>
                    )}
                  </div>
                </div>

                {/* LinkedIn Link */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3.5 transition-colors hover:bg-gray-50">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <LinkedInIcon className="size-3.5 text-[#0077b5]" />
                    <span>LinkedIn Profile</span>
                  </div>
                  <div className="mt-1">
                    {linkedinUrl ? (
                      <a
                        href={linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0077b5] hover:underline"
                      >
                        <span>View Company Page</span>
                        <ExternalLink className="size-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">
                        Not discovered
                      </span>
                    )}
                  </div>
                </div>

                {/* Extra metadata: Founded / Location */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3.5 transition-colors hover:bg-gray-50">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="size-3.5 text-gray-400" />
                    <span>Founded &amp; Location</span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-gray-800">
                    {location || foundedYear ? (
                      <>
                        {location && <span>{location}</span>}
                        {location && foundedYear && <span> · </span>}
                        {foundedYear && <span>Est. {foundedYear}</span>}
                      </>
                    ) : (
                      <span className="text-gray-400">Standard tier info</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Verified Role */}
            <div className="border-t border-gray-100 pt-4">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Contact Verification
              </span>
              <div className="mt-2.5 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-50/80 px-3 py-1.5 text-xs text-emerald-900 border border-emerald-100">
                  <span className="font-semibold">Role:</span>
                  <span>{jobTitle || "Business Decision Maker"}</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-700 border border-gray-200">
                  <span className="font-semibold">Email:</span>
                  <span>{lead.email}</span>
                </div>
                {lead.phone && (
                  <div className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-700 border border-gray-200">
                    <span className="font-semibold">Phone:</span>
                    <span>{lead.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Enriched Timestamp & Audit Footer */}
            {formattedEnrichedAt && (
              <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-[11px] text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3" />
                  Last enriched: {formattedEnrichedAt}
                </span>
                <span>ID: {enrichment?.id.slice(0, 8)}...</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
