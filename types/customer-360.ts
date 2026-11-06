import type { Customer } from './customer';

export interface ConvertedLeadItem {
  id: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  phone?: string | null;
  companyName?: string | null;
  jobTitle?: string | null;
  convertedAt?: string | null;
}

export interface InteractionItem {
  id: string;
  leadId?: string | null;
  type: string;
  channel?: string | null;
  subject?: string | null;
  content?: string | null;
  occurredAt?: string | null;
}

export interface IntelligenceItem {
  qualifications: Array<{
    id: string;
    leadId: string;
    status: string;
    confidence?: number | null;
    intent?: string | null;
    reason?: string | null;
    evaluatedAt?: string | null;
  }>;
  enrichments: Array<{
    id: string;
    leadId: string;
    provider: string;
    companyName?: string | null;
    companyIndustry?: string | null;
    companySize?: number | null;
    status: string;
    enrichedAt?: string | null;
  }>;
  scores: Array<{
    id: string;
    leadId: string;
    score: number;
    label: string;
    reason?: string | null;
    modelName?: string | null;
    createdAt?: string | null;
  }>;
}

export interface FollowUpSummary {
  enrollments: Array<{
    id: string;
    sequenceId: string;
    sequenceName?: string | null;
    status: string;
    enrolledAt?: string | null;
  }>;
  executions: Array<{
    id: string;
    enrollmentId: string;
    stepOrder?: number | null;
    status: string;
    scheduledAt?: string | null;
    executedAt?: string | null;
  }>;
}

export type SourceCoverageStatus =
  | 'AVAILABLE'
  | 'EMPTY'
  | 'NOT_CONNECTED'
  | 'UNAVAILABLE';

export interface SourceCoverageMap {
  crmProfile: SourceCoverageStatus;
  interactions: SourceCoverageStatus;
  leadIntelligence: SourceCoverageStatus;
  followUps: SourceCoverageStatus;
  segments: SourceCoverageStatus;
  customerIssues: SourceCoverageStatus;
  customerFeedback: SourceCoverageStatus;
}

export interface Customer360AiSummary {
  summary: string;
  keyStrengths: string[];
  potentialRisks: string[];
  growthOpportunities: string[];
  recommendedNextAction: string;
  aiModel?: string | null;
  evaluatedAt?: string | null;
}

export interface Customer360Response {
  customer: Customer;
  convertedLeads: ConvertedLeadItem[];
  interactions: InteractionItem[];
  intelligence: IntelligenceItem;
  followUps: FollowUpSummary;
  segments: Array<{
    segmentId: string;
    segmentName?: string | null;
    assignmentType: string;
    confidence?: number | null;
    assignedReason?: string | null;
    assignedAt?: string | null;
  }>;
  sourceCoverage: SourceCoverageMap;
  aiSummary: Customer360AiSummary | null;
  latestWorkflowRun: {
    id: string;
    status: string;
    startedAt?: string | null;
    completedAt?: string | null;
    errorMessage?: string | null;
  } | null;
}

