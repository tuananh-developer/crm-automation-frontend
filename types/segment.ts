/**
 * UC09 - Customer Segmentation: shared types.
 *
 * Shapes mirror the NestJS entities that already exist in the backend:
 *  - `segments`            -> Segment entity (src/modules/customers/entities/segment.entity.ts)
 *  - `customer_segments`   -> CustomerSegment entity (customer-segment.entity.ts)
 *  - `SegmentAssignmentType` enum (src/modules/customers/enums/customer.enum.ts)
 *
 * `Segment.criteria` is a jsonb column and has no dedicated entity, so the
 * criteria payload below is the document this frontend writes to / reads from.
 */

export type SegmentAssignmentType = "MANUAL" | "RULE" | "AI";

export type SegmentStatus = "ACTIVE" | "INACTIVE";

export type SegmentCriteriaOperator =
  | "equals"
  | "not_equals"
  | "greater_than"
  | "greater_than_or_equal"
  | "less_than"
  | "less_than_or_equal"
  | "contains";

export type SegmentCriteriaLogic = "AND" | "OR";

/** One condition inside `SegmentCriteria.conditions`. */
export interface SegmentCriterion {
  id: string;
  field: string;
  operator: SegmentCriteriaOperator;
  value: string;
}

/**
 * jsonb document stored in `segments.criteria`.
 * `assignmentType` lives here because the Segment entity has no such column;
 * the authoritative assignment type of a customer stays on `customer_segments`.
 */
export interface SegmentCriteria {
  logic: SegmentCriteriaLogic;
  conditions: SegmentCriterion[];
  assignmentType: SegmentAssignmentType;
  minConfidence?: number | null;
}

/**
 * The API embeds the full Customer row inside `customer_segments`, so the
 * reference keeps every field the backend sends.
 */
export interface SegmentCustomerRef {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  companyName?: string | null;
  companyWebsite?: string | null;
  jobTitle?: string | null;
  companySize?: number | null;
  industry?: string | null;
  status?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Full User row as embedded in `creator`, `updater` and `assignedByUser`. */
export interface SegmentUserRef {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  status?: string | null;
  lastLoginAt?: string | null;
}

export interface Segment {
  id: string;
  name: string;
  description: string | null;
  criteria: SegmentCriteria | null;
  isActive: boolean;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  creator?: SegmentUserRef | null;
  updater?: SegmentUserRef | null;
  customerCount?: number | null;
}

export interface CustomerSegmentAssignment {
  customerId: string;
  segmentId: string;
  assignmentType: SegmentAssignmentType;
  /** numeric(5,4) column: the postgres driver returns a string. */
  confidence: string | number | null;
  assignedReason: string | null;
  assignedAt: string;
  assignedBy: string | null;
  customer?: SegmentCustomerRef | null;
  segment?: Pick<Segment, "id" | "name"> | null;
  assignedByUser?: SegmentUserRef | null;
  score?: number | null;
}

export type EvaluationStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

/** Result of `POST /segments/:id/evaluate`. */
export interface SegmentEvaluationResult {
  customerId: string;
  customerName?: string | null;
  segmentId: string;
  segmentName?: string | null;
  assignmentType: SegmentAssignmentType;
  confidence: string | number | null;
  assignmentReason: string | null;
  assignedAt: string;
  assignedBy: string | null;
  assignedByUser?: SegmentUserRef | null;
  status?: EvaluationStatus;
  /** False when the customer was evaluated but did not match the criteria. */
  matched?: boolean;
}

export interface SegmentListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SegmentListResponse {
  data: Segment[];
  meta?: SegmentListMeta;
}

export interface SegmentCustomerListResponse {
  data: CustomerSegmentAssignment[];
  meta?: SegmentListMeta;
}

export interface SegmentPayload {
  /** Required by CreateSegmentDto: the user creating the segment. */
  createdBy: string;
  name: string;
  description?: string | null;
  criteria: SegmentCriteria;
  isActive: boolean;
}

/** Payload for a single-customer evaluation request. */
export interface EvaluateCustomerPayload {
  customerId: string;
  assignmentType: SegmentAssignmentType;
}

export interface EvaluateBulkPayload {
  customerIds?: string[];
  assignmentType: SegmentAssignmentType;
}

export interface EvaluateBulkResult {
  status: EvaluationStatus;
  total: number;
  processed: number;
  matched: number;
  message?: string;
}

export const SEGMENT_CRITERIA_FIELDS = [
  {
    value: "score",
    label: "Lead score",
    type: "number" as const,
    hint: "AI lead score of the converted lead (0-100)",
  },
  {
    value: "industry",
    label: "Industry",
    type: "string" as const,
    hint: "Customer industry",
  },
  {
    value: "companySize",
    label: "Company size",
    type: "number" as const,
    hint: "Number of employees",
  },
  {
    value: "companyName",
    label: "Company name",
    type: "string" as const,
    hint: "Company name",
  },
  {
    value: "jobTitle",
    label: "Job title",
    type: "string" as const,
    hint: "Contact job title",
  },
  {
    value: "status",
    label: "Customer status",
    type: "string" as const,
    hint: "Value of customers.status",
  },
  {
    value: "email",
    label: "Email domain",
    type: "string" as const,
    hint: "Use contains with the domain, e.g. @acme.com",
  },
];

export const SEGMENT_OPERATORS: Array<{
  value: SegmentCriteriaOperator;
  label: string;
  symbols: Record<"number" | "string", string>;
}> = [
  {
    value: "equals",
    label: "Equals",
    symbols: { number: "=", string: "=" },
  },
  {
    value: "not_equals",
    label: "Not equals",
    symbols: { number: "!=", string: "!=" },
  },
  {
    value: "greater_than",
    label: "Greater than",
    symbols: { number: ">", string: ">" },
  },
  {
    value: "greater_than_or_equal",
    label: "Greater or equal",
    symbols: { number: ">=", string: ">=" },
  },
  {
    value: "less_than",
    label: "Less than",
    symbols: { number: "<", string: "<" },
  },
  {
    value: "less_than_or_equal",
    label: "Less or equal",
    symbols: { number: "<=", string: "<=" },
  },
  {
    value: "contains",
    label: "Contains",
    symbols: { number: "contains", string: "contains" },
  },
];
/**
 * Display labels for `customer_segments.assignment_type`.
 * The API stores MANUAL | RULE | AI; the product language shows
 * RULE_BASED / AI_ASSIGNED.
 */
export const ASSIGNMENT_TYPE_LABELS: Record<SegmentAssignmentType, string> = {
  MANUAL: "MANUAL",
  RULE: "RULE_BASED",
  AI: "AI_ASSIGNED",
};
