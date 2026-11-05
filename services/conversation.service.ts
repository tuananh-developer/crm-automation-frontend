import { apiClient } from "./api-client";
import type {
  ActionItem,
  ConversationTranscriptItem,
  CreateTranscriptPayload,
} from "@/types/conversation";

/**
 * T12-WF09: Conversation Intelligence & Summarizer API service.
 */
export async function createTranscript(
  payload: CreateTranscriptPayload,
): Promise<{
  message: string;
  transcriptId: string;
  workflowRunId: string;
  processingStatus: string;
}> {
  const response = await apiClient.post<{
    message: string;
    transcriptId: string;
    workflowRunId: string;
    processingStatus: string;
  }>("/conversation-transcripts", payload);
  return response.data;
}

export async function getTranscriptSummary(
  transcriptId: string,
): Promise<ConversationTranscriptItem> {
  const response = await apiClient.get<ConversationTranscriptItem>(
    `/conversation-transcripts/${transcriptId}/summary`,
  );
  return response.data;
}

export async function updateActionItem(
  itemId: string,
  data: Partial<ActionItem>,
): Promise<ActionItem> {
  const response = await apiClient.patch<ActionItem>(
    `/conversation-action-items/${itemId}`,
    data,
  );
  return response.data;
}

