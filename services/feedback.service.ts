import { apiClient } from "./api-client";
import type {
  CreateFeedbackPayload,
  CustomerFeedbackItem,
} from "@/types/feedback";

/**
 * T12-WF14: Customer Feedback API service.
 */
export async function getCustomerFeedback(
  customerId: string,
): Promise<CustomerFeedbackItem[]> {
  const response = await apiClient.get<CustomerFeedbackItem[]>(
    `/customers/${customerId}/feedback`,
  );
  return response.data;
}

export async function createFeedback(
  payload: CreateFeedbackPayload,
): Promise<{ message: string; feedbackId: string; workflowRunId: string }> {
  const response = await apiClient.post<{
    message: string;
    feedbackId: string;
    workflowRunId: string;
  }>("/feedback", payload);
  return response.data;
}

