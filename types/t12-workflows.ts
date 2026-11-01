export type T12EntityType = "Lead" | "Customer";

export interface StartWorkflowResponse {
  workflowRunId: string;
  status: string;
  reused: boolean;
  meetingId?: string | null;
}

export interface NextBestActionItem {
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
  entityType: T12EntityType;
  entityId: string;
  recommendations: NextBestActionItem[];
  requiresHumanApproval: boolean;
  status: "RECOMMENDED" | "PENDING_APPROVAL" | "REVIEWED";
  reviewTaskId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SalesMeeting {
  id: string;
  workflowRunId: string;
  ownerId: string;
  leadId: string | null;
  customerId: string | null;
  attendeeIds: string[];
  meetingPurpose: string | null;
  scheduledAt: string | null;
  sourceType: string;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  transcriptId: string | null;
  summaryId: string | null;
  notificationSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationSummary {
  id: string;
  meetingId: string | null;
  transcriptId: string;
  workflowRunId: string;
  summary: string;
  decisions: Array<Record<string, unknown>>;
  risks: Array<Record<string, unknown>>;
  createdAt: string;
}

export interface MeetingTranscriptMetadata {
  id: string;
  sourceType: string;
  redactionMode: string;
  contentHash: string;
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

export interface SalesMeetingResponse {
  meeting: SalesMeeting;
  transcript: MeetingTranscriptMetadata | null;
  summary: ConversationSummary | null;
  actionItems: MeetingActionItem[];
}

export interface StartSalesMeetingInput {
  leadId?: string;
  customerId?: string;
  attendeeIds: string[];
  transcript: string;
  meetingPurpose?: string;
  scheduledAt?: string;
  sourceType?: string;
}

export interface ProductCatalogItem {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  unitPrice: string | number;
  currency: string;
  taxRatePercent: string | number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  requestedBy: string;
  reviewedBy: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  decisionComment: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface Quote {
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
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  approvalRequired: boolean;
  submittedForApprovalAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  pricingSnapshot?: Record<string, unknown>;
  items?: QuoteItem[];
  approval?: QuoteApproval | null;
  createdAt: string;
  updatedAt: string;
}

export interface StartQuoteDraftInput {
  customerId?: string;
  leadId?: string;
  requestedItems: Array<{ catalogItemId: string; quantity: number }>;
  requirements?: string;
  currency: string;
}

export interface CreateCatalogItemInput {
  sku: string;
  name: string;
  description?: string;
  unitPrice: number;
  currency: string;
  taxRatePercent: number;
}

export interface DecideQuoteApprovalInput {
  comment?: string;
}
