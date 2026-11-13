export type WorkflowStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCESS"
  | "PARTIAL"
  | "FAILED"
  | "CANCELLED";

export interface WorkflowAcceptedResponse {
  workflowRunId: string;
  status: WorkflowStatus | string;
  reused: boolean;
  meetingId?: string | null;
}

export interface AssigneeOption {
  id: string;
  name: string;
  role: "ADMIN" | "SALES" | string;
}

export interface StartNextBestActionRequest {
  entityType: "Lead" | "Customer";
  entityId: string;
}

export interface NextBestAction {
  actionCode: string;
  rank: number;
  confidence: number;
  explanation: string;
  evidenceIds: string[];
  requiresApproval: boolean;
}

export interface NextBestActionRecommendation {
  id: string;
  workflowRunId: string;
  entityType: "Lead" | "Customer";
  entityId: string;
  recommendations: NextBestAction[];
  requiresHumanApproval: boolean;
  status: "RECOMMENDED" | "PENDING_APPROVAL" | "REVIEWED" | string;
  reviewTaskId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StartSalesMeetingRequest {
  leadId?: string;
  customerId?: string;
  attendeeIds: string[];
  transcript: string;
  meetingPurpose?: string;
  scheduledAt?: string;
  sourceType?: string;
}

export interface SalesMeetingRecord {
  id: string;
  workflowRunId: string;
  ownerId: string;
  leadId: string | null;
  customerId: string | null;
  attendeeIds: string[];
  meetingPurpose: string | null;
  scheduledAt: string | null;
  sourceType: string;
  status: "PROCESSING" | "COMPLETED" | "FAILED" | string;
  transcriptId: string | null;
  summaryId: string | null;
  notificationSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingTranscriptMetadata {
  id: string;
  sourceType: string;
  redactionMode: string;
  contentHash: string;
  createdAt: string;
}

export interface MeetingSummary {
  id: string;
  meetingId: string | null;
  transcriptId: string;
  workflowRunId: string;
  summary: string;
  decisions: Array<Record<string, unknown>>;
  risks: Array<Record<string, unknown>>;
  createdAt: string;
}

export interface MeetingActionItem {
  id: string;
  summaryId: string;
  workflowRunId: string;
  title: string;
  description: string | null;
  ownerAttendeeId: string | null;
  dueDate: string | null;
  evidence: string | null;
  confidence: number | string;
  requiresConfirmation: boolean;
  status: "PENDING_CONFIRMATION" | "CONFIRMED" | "REJECTED" | string;
  confirmedBy: string | null;
  confirmationNote: string | null;
  createdAt: string;
}

export interface SalesMeetingDetail {
  meeting: SalesMeetingRecord;
  transcript: MeetingTranscriptMetadata | null;
  summary: MeetingSummary | null;
  actionItems: MeetingActionItem[];
}

export interface ConfirmMeetingActionItemRequest {
  decision: "CONFIRM" | "REJECT";
  comment?: string;
}

export interface CatalogItem {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  unitPrice: string | number;
  currency: string;
  taxRatePercent: string | number;
  isActive: boolean;
}

export interface StartQuoteDraftRequest {
  customerId?: string;
  leadId?: string;
  requestedItems: Array<{ catalogItemId: string; quantity: number }>;
  requirements?: string;
  currency: string;
}

export interface QuoteItem {
  id: string;
  quoteId: string;
  catalogItemId: string | null;
  sku: string;
  nameSnapshot: string;
  descriptionSnapshot: string | null;
  quantity: number;
  unitPriceSnapshot: string | number;
  taxRatePercent: string | number;
  lineSubtotal: string | number;
  lineDiscount: string | number;
  lineTax: string | number;
  lineTotal: string | number;
}

export interface QuoteApproval {
  id: string;
  quoteId: string;
  status: string;
  reviewedBy: string | null;
  decisionComment: string | null;
  resolvedAt: string | null;
}

export interface QuoteRecord {
  id: string;
  workflowRunId: string;
  createdBy: string;
  customerId: string | null;
  leadId: string | null;
  title: string;
  executiveSummary: string | null;
  body: string | null;
  currency: string;
  subtotal: string | number;
  discountTotal: string | number;
  taxTotal: string | number;
  totalAmount: string | number;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | string;
  approvalRequired: boolean;
  submittedForApprovalAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  pricingSnapshot: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  items?: QuoteItem[];
  approval?: QuoteApproval | null;
}

export interface DecideQuoteRequest {
  comment?: string;
}
