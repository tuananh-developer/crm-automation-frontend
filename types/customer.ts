/**
 * UC09 - Customer management types.
 *
 * Shapes mirror the NestJS entities returned by CustomersController
 * (src/modules/customers/entities/customer.entity.ts).
 */

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  companyWebsite: string | null;
  jobTitle: string | null;
  companySize: number | null;
  industry: string | null;
  /** Whether the customer is flagged as a strategic account (WF15 Account Health). */
  isStrategic?: boolean;
  /** Free-form varchar in the schema, e.g. CONVERTED. */
  status: string | null;
  createdBy: string;
  updatedBy: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  creator?: { id: string; name?: string | null; email?: string | null } | null;
  segments?: {
  id: string;
  name: string | null;
  assignmentType: string;
  confidence: string | number | null;
  assignedReason: string | null;
  assignedAt: string | null;
}[];
}

/** Lead a customer was converted from (UC08 lead conversion). */
export interface CustomerConvertedLead {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  status: string;
  sourceId: string;
  createdAt: string;
}

/** Segment membership row returned inside the customer detail. */
export interface CustomerSegmentMembership {
  customerId: string;
  segmentId: string;
  assignmentType: string;
  /** numeric(5,4) column: the pg driver returns a string. */
  confidence: string | number | null;
  assignedReason: string | null;
  assignedAt: string;
  assignedBy: string | null;
  segment?: {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
  } | null;
  assignedByUser?: { id: string; name?: string | null } | null;
}

/** `GET /customers/:id` - customer + converted lead + segment memberships. */
export interface CustomerDetail extends Customer {
  convertedLeads: CustomerConvertedLead[];
  customerSegments: CustomerSegmentMembership[];
  segmentCount: number;
}

export interface CustomerListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CustomerListResponse {
  data: Customer[];
  meta?: CustomerListMeta;
}

/** WF06 - Churn Risk Monitoring assessment types. */
export type ChurnRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "INSUFFICIENT_DATA";

export interface CustomerChurnEvidenceItem {
  source?: string;
  signal?: string;
  value?: unknown;
  occurredAt?: string;
  [key: string]: unknown;
}

export interface CustomerChurnAssessment {
  id: string;
  customerId: string;
  score: number | null;
  riskLevel: ChurnRiskLevel | string;
  asOfDate: string | null;
  policyVersion: string;
  evidence: CustomerChurnEvidenceItem[] | null;
  coverage: Record<string, unknown> | null;
  workflowRunId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  assessedAt: string;
}

/** WF15 - Strategic Account Health snapshot types. */
export type AccountHealthStatus =
  | "HEALTHY"
  | "AT_RISK"
  | "CRITICAL"
  | "INSUFFICIENT_DATA"
  | string;

export interface AccountHealthBreakdown {
  engagement?: number | null;
  feedback?: number | null;
  openIssues?: number | null;
  followUpCompletion?: number | null;
  policyVersion?: string;
  [key: string]: unknown;
}

export interface AccountHealthSnapshot {
  id: string;
  customerId: string;
  score: number;
  status: AccountHealthStatus;
  breakdown: AccountHealthBreakdown | null;
  evidence: Array<Record<string, unknown>> | null;
  missingData: string[] | null;
  dataCoverage: Record<string, unknown> | null;
  assessedAt: string;
  createdAt: string;
}
