import { apiClient } from "./api-client";
import type {
  AssignReviewTaskPayload,
  CreateReviewTaskPayload,
  LeadQualification,
  ResolveReviewTaskPayload,
  ReviewTask,
} from "@/types/review";

/**
 * UC07 - Human Review API layer.
 *
 * Backend endpoints (NestJS ReviewController, prefix /api/v1):
 *   POST  /review-tasks            { leadId, workflowRunId?, reason? } -> ReviewTask
 *   GET   /review-tasks                                       -> ReviewTask[]
 *   GET   /review-tasks/:id                                    -> ReviewTask
 *   PATCH /review-tasks/:id/assign  { reviewerId }             -> ReviewTask
 *   PATCH /review-tasks/:id/start                             -> ReviewTask
 *   PATCH /review-tasks/:id/resolve { decision, reviewComment? } -> ReviewTask
 *
 * Contract details verified against the running backend:
 *  - `GET /review-tasks` takes no query parameters, so status / reviewer
 *    filtering happens on the client.
 *  - `resolve` only accepts a task whose status is IN_REVIEW (400 otherwise),
 *    so a PENDING task has to be assigned and started first.
 *  - `assign` persists `assignedTo` but echoes a stale body
 *    (`assignedTo: null`), therefore callers must refetch the task.
 */

export async function getReviewTasks(): Promise<ReviewTask[]> {
  const response = await apiClient.get<ReviewTask[]>("/review-tasks");
  const body = response.data as
    | ReviewTask[]
    | { data?: ReviewTask[] }
    | null;

  if (Array.isArray(body)) return body;

  return (body as { data?: ReviewTask[] } | null)?.data ?? [];
}

export async function getReviewTask(id: string): Promise<ReviewTask> {
  const response = await apiClient.get<ReviewTask>(`/review-tasks/${id}`);

  return response.data;
}

export async function createReviewTask(
  payload: CreateReviewTaskPayload,
): Promise<ReviewTask> {
  const response = await apiClient.post<ReviewTask>("/review-tasks", payload);

  return response.data;
}

/** Claim / assign a task to a reviewer. Refetch afterwards (stale echo). */
export async function assignReviewTask(
  id: string,
  payload: AssignReviewTaskPayload,
): Promise<ReviewTask> {
  const response = await apiClient.patch<ReviewTask>(
    `/review-tasks/${id}/assign`,
    payload,
  );

  return response.data;
}

/** PENDING -> IN_REVIEW. Required before a decision can be submitted. */
export async function startReviewTask(id: string): Promise<ReviewTask> {
  const response = await apiClient.patch<ReviewTask>(`/review-tasks/${id}/start`);

  return response.data;
}

/** IN_REVIEW -> RESOLVED. */
export async function resolveReviewTask(
  id: string,
  payload: ResolveReviewTaskPayload,
): Promise<ReviewTask> {
  const response = await apiClient.patch<ReviewTask>(
    `/review-tasks/${id}/resolve`,
    payload,
  );

  return response.data;
}

/**
 * Latest AI qualification for a lead - the only real source of an AI
 * confidence score in the backend. Returns null when the lead has never
 * been qualified (the endpoint answers 200 with an empty body).
 */
export async function getLatestLeadQualification(
  leadId: string,
): Promise<LeadQualification | null> {
  const response = await apiClient.get<LeadQualification | "" | null>(
    `/lead-intelligence/qualifications/${leadId}/latest`,
  );

  const body = response.data;

  return body && typeof body === "object" ? body : null;
}
