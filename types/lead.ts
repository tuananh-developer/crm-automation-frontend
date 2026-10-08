export type LeadStatus =
  | "NEW"
  | "QUALIFYING"
  | "QUALIFIED"
  | "CONTACTED"
  | "PROPOSAL_SENT"
  | "NEGOTIATING"
  | "CONVERTED"
  | "LOST";

export type EnrichmentStatus = "PENDING" | "SUCCESS" | "PARTIAL" | "FAILED";

export type ScoreLabel = "HOT" | "WARM" | "COLD";

export interface LeadSource {
  id: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface LeadOwner {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  companyName: string;
  companyWebsite?: string | null;
  jobTitle?: string | null;
  companySize?: number | null;
  industry?: string | null;
  status: LeadStatus;
  sourceId?: string | null;
  ownerId?: string | null;
  source?: LeadSource | null;
  owner?: LeadOwner | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadEnrichment {
  id: string;
  leadId: string;
  workflowRunId?: string | null;
  provider: string;
  externalRequestId?: string | null;
  status: EnrichmentStatus;
  companyName?: string | null;
  companyWebsite?: string | null;
  companyIndustry?: string | null;
  companySize?: number | null;
  contactJobTitle?: string | null;
  contactLinkedinUrl?: string | null;
  rawResponse?: Record<string, unknown> | null;
  errorMessage?: string | null;
  enrichedAt: string;
  createdAt: string;
}

export interface ScoringFeatures {
  companyFit?: number;
  intentScore?: number;
  industryMatch?: number;
  companySizeWeight?: number;
  titleSeniority?: number;
  engagementScore?: number;
  budgetSignals?: number;
  [key: string]: unknown;
}

export interface LeadScore {
  id: string;
  leadId: string;
  workflowRunId?: string | null;
  score: number | string;
  label: ScoreLabel;
  reason?: string | null;
  modelProvider?: string | null;
  modelName?: string | null;
  modelVersion?: string | null;
  scoringFeatures?: ScoringFeatures | null;
  inputSnapshot?: Record<string, unknown> | null;
  outputSnapshot?: Record<string, unknown> | null;
  createdAt: string;
}

export interface TriggerEnrichmentDto {
  provider?: string;
}

export interface TriggerScoringDto {
  modelProvider?: string;
  modelName?: string;
}

export interface LeadsListResponse {
  data: Lead[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
