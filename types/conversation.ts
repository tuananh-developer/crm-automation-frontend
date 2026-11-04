export type ActionItemStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ActionItemApprovalState = 'PROPOSED' | 'APPROVED' | 'REJECTED';

export interface ActionItem {
  id: string;
  summaryId?: string;
  title: string;
  assignedTo?: string | null;
  dueAt?: string | null;
  status: ActionItemStatus;
  approvalState: ActionItemApprovalState;
  assignedUser?: { id: string; name?: string | null; email?: string | null } | null;
  createdAt?: string;
}

export interface ConversationSummaryData {
  id: string;
  summaryText: string;
  sentiment?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | null;
  intent?: string | null;
  keyPoints?: string[];
  actionItems?: ActionItem[];
  createdAt?: string;
}

export interface ConversationTranscriptItem {
  transcriptId: string;
  processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  redactedContent: string;
  sourceType: string;
  summary: ConversationSummaryData | null;
}

export interface CreateTranscriptPayload {
  customerId?: string;
  leadId?: string;
  meetingId?: string;
  sourceType?: string;
  content: string;
}

