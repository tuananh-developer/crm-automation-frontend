import { apiClient } from "./api-client";
import type {
  ExecuteFollowUpPayload,
  ExecuteFollowUpResponse,
  FollowUpExecution,
  FollowUpExecutionQuery,
} from "@/types/follow-up";

/**
 * UC06 - Execute Follow-up API layer.
 *
 * Backend endpoints (NestJS, prefix /api/v1):
 *   GET  /follow-ups/executions?enrollmentId&stepId&status -> FollowUpExecution[]
 *   POST /follow-ups/executions { enrollmentId, stepId? }    -> ExecuteFollowUpResult
 *
 * Retrying a failed step reuses the POST endpoint with the same
 * enrollmentId + stepId: the backend reuses the existing execution row
 * instead of creating a duplicate, and increments `retryCount`.
 */

export async function getFollowUpExecutions(
  query: FollowUpExecutionQuery = {},
): Promise<FollowUpExecution[]> {
  const params = {
    ...(query.enrollmentId ? { enrollmentId: query.enrollmentId } : {}),
    ...(query.stepId ? { stepId: query.stepId } : {}),
    ...(query.status ? { status: query.status } : {}),
  };

  const response = await apiClient.get<FollowUpExecution[]>(
    "/follow-ups/executions",
    { params },
  );

  // Backend currently returns a raw array; stay tolerant of a { data } envelope.
  if (Array.isArray(response.data)) return response.data;

  const body = response.data as { data?: FollowUpExecution[] } | null;
  return body?.data ?? [];
}

export async function executeFollowUp(
  payload: ExecuteFollowUpPayload,
): Promise<ExecuteFollowUpResponse> {
  const response = await apiClient.post<ExecuteFollowUpResponse>(
    "/follow-ups/executions",
    payload,
  );

  return response.data;
}

/** Retry Step — same endpoint as execute, driven by the execution row. */
export async function retryFollowUpStep(
  execution: FollowUpExecution,
): Promise<ExecuteFollowUpResponse> {
  return executeFollowUp({
    enrollmentId: execution.enrollmentId,
    stepId: execution.stepId,
  });
}