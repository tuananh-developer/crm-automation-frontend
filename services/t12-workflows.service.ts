import { apiClient } from "@/services/api-client";
import type {
  CreateCatalogItemInput,
  DecideQuoteApprovalInput,
  NextBestActionRecommendation,
  ProductCatalogItem,
  Quote,
  SalesMeetingResponse,
  StartQuoteDraftInput,
  StartSalesMeetingInput,
  StartWorkflowResponse,
  T12EntityType,
} from "@/types/t12-workflows";

function idempotencyHeaders(key: string) {
  return { headers: { "Idempotency-Key": key } };
}

export const t12WorkflowService = {
  async requestNextBestAction(
    input: { entityType: T12EntityType; entityId: string },
    key: string,
  ): Promise<StartWorkflowResponse> {
    const { data } = await apiClient.post<StartWorkflowResponse>(
      "/next-best-actions/requests",
      input,
      idempotencyHeaders(key),
    );
    return data;
  },

  async getNextBestAction(recommendationId: string): Promise<NextBestActionRecommendation> {
    const { data } = await apiClient.get<NextBestActionRecommendation>(
      `/next-best-actions/${encodeURIComponent(recommendationId)}`,
    );
    return data;
  },

  async requestSalesMeeting(
    input: StartSalesMeetingInput,
    key: string,
  ): Promise<StartWorkflowResponse> {
    const { data } = await apiClient.post<StartWorkflowResponse>(
      "/sales-meetings/requests",
      input,
      idempotencyHeaders(key),
    );
    return data;
  },

  async getSalesMeeting(meetingId: string): Promise<SalesMeetingResponse> {
    const { data } = await apiClient.get<SalesMeetingResponse>(
      `/sales-meetings/${encodeURIComponent(meetingId)}`,
    );
    return data;
  },

  async confirmMeetingActionItem(
    actionItemId: string,
    decision: "CONFIRM" | "REJECT",
    comment?: string,
  ): Promise<{ id: string; summaryId: string; status: string; confirmedBy: string }> {
    const { data } = await apiClient.patch(
      `/sales-meetings/action-items/${encodeURIComponent(actionItemId)}/confirmation`,
      { decision, comment },
    );
    return data;
  },

  async listCatalog(): Promise<ProductCatalogItem[]> {
    const { data } = await apiClient.get<ProductCatalogItem[]>("/catalog/items");
    return Array.isArray(data) ? data : [];
  },

  async createCatalogItem(input: CreateCatalogItemInput): Promise<ProductCatalogItem> {
    const { data } = await apiClient.post<ProductCatalogItem>("/catalog/items", input);
    return data;
  },

  async listQuotes(): Promise<Quote[]> {
    const { data } = await apiClient.get<Quote[]>("/quotes");
    return Array.isArray(data) ? data : [];
  },

  async getQuote(quoteId: string): Promise<Quote> {
    const { data } = await apiClient.get<Quote>(`/quotes/${encodeURIComponent(quoteId)}`);
    return data;
  },

  async requestQuoteDraft(input: StartQuoteDraftInput, key: string): Promise<StartWorkflowResponse> {
    const { data } = await apiClient.post<StartWorkflowResponse>(
      "/quotes/requests",
      input,
      idempotencyHeaders(key),
    );
    return data;
  },

  async approveQuote(quoteId: string, input: DecideQuoteApprovalInput = {}) {
    const { data } = await apiClient.post(
      `/quotes/${encodeURIComponent(quoteId)}/approve`,
      input,
    );
    return data;
  },

  async rejectQuote(quoteId: string, input: DecideQuoteApprovalInput = {}) {
    const { data } = await apiClient.post(
      `/quotes/${encodeURIComponent(quoteId)}/reject`,
      input,
    );
    return data;
  },
};
