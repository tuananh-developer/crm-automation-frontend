"use client";

import { useQuery } from "@tanstack/react-query";
import { BrainCircuit, Loader2 } from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { getLatestLeadQualification } from "@/services/review.service";

function formatConfidence(confidence: number): string {
  const percent = confidence <= 1 ? confidence * 100 : confidence;

  return `${percent.toFixed(percent >= 99.95 ? 0 : 1)}%`;
}

function toneForConfidence(confidence: number): BadgeTone {
  if (confidence >= 0.8) return "success";
  if (confidence >= 0.5) return "warning";

  return "danger";
}

/**
 * AI confidence of the latest qualification for a lead.
 * Source: GET /lead-intelligence/qualifications/:leadId/latest
 */
export function LeadConfidenceBadge({ leadId }: { leadId: string }) {
  const query = useQuery({
    queryKey: ["lead-qualification", leadId],
    queryFn: () => getLatestLeadQualification(leadId),
    enabled: Boolean(leadId),
  });

  if (query.isLoading) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs text-gray-400"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="size-3 animate-spin" />
        Đang tải confidence…
      </span>
    );
  }

  if (query.isError) {
    return (
      <span className="text-xs text-red-600">
        Không tải được confidence AI
      </span>
    );
  }

  const qualification = query.data;

  if (!qualification || qualification.confidence === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
        <BrainCircuit className="size-3" />
        Chưa có dữ liệu AI
      </span>
    );
  }

  return (
    <Badge tone={toneForConfidence(qualification.confidence)}>
      <BrainCircuit />
      AI confidence {formatConfidence(qualification.confidence)}
    </Badge>
  );
}
