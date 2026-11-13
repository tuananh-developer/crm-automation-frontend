import { apiClient } from "@/services/api-client";
import type {
  AssigneeOption,
  ConfirmMeetingActionItemRequest,
  NextBestActionRecommendation,
  SalesMeetingDetail,
  StartNextBestActionRequest,
  StartQuoteDraftRequest,
  StartSalesMeetingRequest,
  WorkflowAcceptedResponse,
  CatalogItem,
  QuoteRecord,
  DecideQuoteRequest,
} from "@/types/t12-workflows";

function idempotencyHeaders(key: string) {
  return { headers: { "Idempotency-Key": key } };
}

export function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `crm-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
}

export const t12WorkflowService = {
  async requestNextBestAction(
    payload: StartNextBestActionRequest,
    idempotencyKey: string,
  ): Promise<WorkflowAcceptedResponse> {
    const { data } = await apiClient.post<WorkflowAcceptedResponse>(
      "/next-best-actions/requests",
      payload,
      idempotencyHeaders(idempotencyKey),
    );
    return data;
  },

  async getNextBestAction(
    recommendationId: string,
  ): Promise<NextBestActionRecommendation> {
    const { data } = await apiClient.get<NextBestActionRecommendation>(
      `/next-best-actions/${encodeURIComponent(recommendationId)}`,
    );
    return data;
  },

  async getAssignees(): Promise<AssigneeOption[]> {
    const { data } = await apiClient.get<AssigneeOption[]>("/users/assignees");
    return Array.isArray(data) ? data : [];
  },

  async requestSalesMeeting(
    payload: StartSalesMeetingRequest,
    idempotencyKey: string,
  ): Promise<WorkflowAcceptedResponse> {
    const { data } = await apiClient.post<WorkflowAcceptedResponse>(
      "/sales-meetings/requests",
      payload,
      idempotencyHeaders(idempotencyKey),
    );
    return data;
  },

  async getSalesMeeting(meetingId: string): Promise<SalesMeetingDetail> {
    const { data } = await apiClient.get<SalesMeetingDetail>(
      `/sales-meetings/${encodeURIComponent(meetingId)}`,
    );
    return data;
  },

  async confirmMeetingActionItem(
    actionItemId: string,
    payload: ConfirmMeetingActionItemRequest,
  ): Promise<{ id: string; summaryId: string; status: string; confirmedBy: string }> {
    const { data } = await apiClient.patch(
      `/sales-meetings/action-items/${encodeURIComponent(actionItemId)}/confirmation`,
      payload,
    );
    return data;
  },

  async getCatalog(): Promise<CatalogItem[]> {
    const { data } = await apiClient.get<CatalogItem[]>("/catalog/items");
    return Array.isArray(data) ? data : [];
  },

  async getQuotes(): Promise<QuoteRecord[]> {
    const { data } = await apiClient.get<QuoteRecord[]>("/quotes");
    return Array.isArray(data) ? data : [];
  },

  async getQuote(quoteId: string): Promise<QuoteRecord> {
    const { data } = await apiClient.get<QuoteRecord>(
      `/quotes/${encodeURIComponent(quoteId)}`,
    );
    return data;
  },

  async requestQuoteDraft(
    payload: StartQuoteDraftRequest,
    idempotencyKey: string,
  ): Promise<WorkflowAcceptedResponse> {
    const { data } = await apiClient.post<WorkflowAcceptedResponse>(
      "/quotes/requests",
      payload,
      idempotencyHeaders(idempotencyKey),
    );
    return data;
  },

  async decideQuote(
    quoteId: string,
    decision: "approve" | "reject",
    payload: DecideQuoteRequest,
  ): Promise<{ quoteId: string; status: string; approvalId: string; workflowRunStatus: string }> {
    const { data } = await apiClient.post(
      `/quotes/${encodeURIComponent(quoteId)}/${decision}`,
      payload,
    );
    return data;
  },
};
