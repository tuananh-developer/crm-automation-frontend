export type IssueType =
  | 'MISSING_FIELD'
  | 'INVALID_EMAIL'
  | 'INVALID_WEBSITE'
  | 'INCONSISTENT_PHONE'
  | 'DUPLICATE_CANDIDATE'
  | 'DOMAIN_MISMATCH'
  | 'WHITESPACE_TRIM'
  | 'CASE_NORMALIZATION'
  | 'INCONSISTENT_DATA';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface DataCleaningFinding {
  id: string;
  recordType: 'Lead';
  recordId: string;
  leadIdentifier?: string;
  fieldName: string;
  issueType: IssueType;
  severity: Severity;
  currentValue: unknown;
  proposedValue: unknown;
  confidence: number;
  reason: string;
  safeToApply: boolean;
  requiresHumanApproval: boolean;
}

export interface DataCleaningSummary {
  totalLeadsScanned: number;
  totalIssuesFound: number;
  issuesByType: Record<string, number>;
  issuesBySeverity: Record<string, number>;
  duplicatesFound: number;
  safeToApplyCount: number;
}

export interface DataCleaningScanResponse {
  workflowRunId: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  startedAt?: string;
  finishedAt?: string;
  inputPayload?: Record<string, unknown>;
  summary?: DataCleaningSummary | null;
  findings?: DataCleaningFinding[];
  appliedStats?: Array<{
    appliedAt: string;
    userId?: string | null;
    appliedCount: number;
    skippedCount: number;
    totalRequested: number;
  }> | null;
  errorMessage?: string | null;
}

export interface AppliedFindingResult {
  findingId: string;
  leadId: string;
  fieldName: string;
  oldValue: unknown;
  newValue: unknown;
  status: 'APPLIED' | 'SKIPPED';
  skipReason?: string;
}

export interface ApplyCleaningResponse {
  workflowRunId: string;
  appliedCount: number;
  skippedCount: number;
  totalRequested: number;
  results: AppliedFindingResult[];
}

export interface CreateScanRequest {
  scope: 'ALL' | 'FILTER';
  filter?: {
    status?: string;
    sourceId?: string;
    search?: string;
    limit?: number;
  };
  userId?: string;
}

export interface ApplyCleaningRequest {
  acceptedFindingIds: string[];
  userId?: string;
}
