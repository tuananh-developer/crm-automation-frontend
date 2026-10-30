export type FeedbackSentiment = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
export type FeedbackUrgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type FeedbackStatus = 'NEW' | 'PROCESSED' | 'ESCALATED' | 'RESOLVED';

export interface CustomerFeedbackItem {
  id: string;
  customerId: string;
  source: string;
  content: string;
  rating?: number | null;
  sentiment?: FeedbackSentiment | null;
  category?: string | null;
  urgency?: FeedbackUrgency | null;
  status: FeedbackStatus;
  receivedAt: string;
  createdAt: string;
  rawAIOutput?: Record<string, any> | null;
}

export interface CreateFeedbackPayload {
  customerId: string;
  source?: string;
  content: string;
  rating?: number;
}

