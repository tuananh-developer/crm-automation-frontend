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

export interface SourceCoverageMap {
  crmProfile: 'AVAILABLE' | 'NOT_CONNECTED';
  interactions: 'AVAILABLE' | 'NOT_CONNECTED';
  leadIntelligence: 'AVAILABLE' | 'NOT_CONNECTED';
  followUps: 'AVAILABLE' | 'NOT_CONNECTED';
  segments: 'AVAILABLE' | 'NOT_CONNECTED';
  customerIssues: 'AVAILABLE' | 'NOT_CONNECTED';
  customerFeedback: 'AVAILABLE' | 'NOT_CONNECTED';
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
  } | null;
}

