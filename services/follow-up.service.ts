import { apiClient } from "./api-client";
import type {
  CancelEnrollmentPayload,
  CreateSequenceDto,
  CreateStepDto,
  EnrollLeadPayload,
  ExecuteFollowUpPayload,
  ExecuteFollowUpResponse,
  FollowUpExecution,
  FollowUpExecutionQuery,
  FollowUpSequence,
  FollowUpStep,
  LeadFollowUpEnrollment,
  SequenceStatus,
  UpdateSequenceDto,
  UpdateStepDto,
} from "@/types/follow-up";

/**
 * UC05 - Sequence & Step Builder API & UC06 - Execute Follow-up API.
 *
 * Backend endpoints (NestJS, prefix /api/v1):
 *   GET    /follow-up/sequences?status          -> FollowUpSequence[]
 *   POST   /follow-up/sequences                 -> FollowUpSequence
 *   GET    /follow-up/sequences/:id             -> FollowUpSequence (with steps)
 *   PATCH  /follow-up/sequences/:id             -> FollowUpSequence
 *   POST   /follow-up/sequences/:id/steps       -> FollowUpStep
 *   GET    /follow-up/sequences/:id/steps       -> FollowUpStep[]
 *   PATCH  /follow-up/steps/:stepId             -> FollowUpStep
 *   POST   /follow-up/enroll                    -> LeadFollowUpEnrollment
 *   GET    /follow-up/enrollments               -> LeadFollowUpEnrollment[]
 *   GET    /follow-ups/executions               -> FollowUpExecution[]
 *   POST   /follow-ups/executions               -> ExecuteFollowUpResult
 */

// ── Sequence Management (UC05) ─────────────────────────────────────────────

export async function getSequences(
  status?: SequenceStatus,
): Promise<FollowUpSequence[]> {
  const response = await apiClient.get<FollowUpSequence[]>(
    "/follow-up/sequences",
    {
      params: status ? { status } : undefined,
    },
  );
  if (Array.isArray(response.data)) return response.data;
  const body = response.data as { data?: FollowUpSequence[] } | null;
  return body?.data ?? [];
}

export async function getSequenceById(id: string): Promise<FollowUpSequence> {
  const response = await apiClient.get<FollowUpSequence>(
    `/follow-up/sequences/${id}`,
  );
  const body = response.data as { data?: FollowUpSequence } & FollowUpSequence;
  return body.data ?? body;
}

export async function createSequence(
  dto: CreateSequenceDto,
): Promise<FollowUpSequence> {
  const response = await apiClient.post<FollowUpSequence>(
    "/follow-up/sequences",
    dto,
  );
  const body = response.data as { data?: FollowUpSequence } & FollowUpSequence;
  return body.data ?? body;
}

export async function updateSequence(
  id: string,
  dto: UpdateSequenceDto,
): Promise<FollowUpSequence> {
  const response = await apiClient.patch<FollowUpSequence>(
    `/follow-up/sequences/${id}`,
    dto,
  );
  const body = response.data as { data?: FollowUpSequence } & FollowUpSequence;
  return body.data ?? body;
}

// ── Step Management (UC05) ─────────────────────────────────────────────────

export async function getStepsBySequence(
  sequenceId: string,
): Promise<FollowUpStep[]> {
  const response = await apiClient.get<FollowUpStep[]>(
    `/follow-up/sequences/${sequenceId}/steps`,
  );
  if (Array.isArray(response.data)) return response.data;
  const body = response.data as { data?: FollowUpStep[] } | null;
  return body?.data ?? [];
}

export async function createStep(
  sequenceId: string,
  dto: CreateStepDto,
): Promise<FollowUpStep> {
  const response = await apiClient.post<FollowUpStep>(
    `/follow-up/sequences/${sequenceId}/steps`,
    dto,
  );
  const body = response.data as { data?: FollowUpStep } & FollowUpStep;
  return body.data ?? body;
}

export async function updateStep(
  stepId: string,
  dto: UpdateStepDto,
): Promise<FollowUpStep> {
  const response = await apiClient.patch<FollowUpStep>(
    `/follow-up/steps/${stepId}`,
    dto,
  );
  const body = response.data as { data?: FollowUpStep } & FollowUpStep;
  return body.data ?? body;
}

// ── Lead Follow-Up Enrollment (UC05) ───────────────────────────────────────

export async function enrollLead(
  payload: EnrollLeadPayload,
): Promise<LeadFollowUpEnrollment> {
  const response = await apiClient.post<
    | { message?: string; enrollment?: LeadFollowUpEnrollment; data?: LeadFollowUpEnrollment }
    | LeadFollowUpEnrollment
  >("/follow-up/enroll", payload);

  const resData = response.data;
  if (resData && "enrollment" in resData && resData.enrollment) {
    return resData.enrollment;
  }
  if (resData && "data" in resData && resData.data) {
    return resData.data;
  }
  return resData as LeadFollowUpEnrollment;
}

export async function getEnrollments(params?: {
  leadId?: string;
  sequenceId?: string;
  status?: string;
}): Promise<LeadFollowUpEnrollment[]> {
  const response = await apiClient.get<LeadFollowUpEnrollment[]>(
    "/follow-up/enrollments",
    { params },
  );
  if (Array.isArray(response.data)) return response.data;
  const body = response.data as { data?: LeadFollowUpEnrollment[] } | null;
  return body?.data ?? [];
}

export async function getEnrollmentsByLead(
  leadId: string,
): Promise<LeadFollowUpEnrollment[]> {
  const response = await apiClient.get<LeadFollowUpEnrollment[]>(
    `/follow-up/leads/${leadId}/enrollments`,
  );
  if (Array.isArray(response.data)) return response.data;
  const body = response.data as { data?: LeadFollowUpEnrollment[] } | null;
  return body?.data ?? [];
}

export async function getEnrollmentById(
  id: string,
): Promise<LeadFollowUpEnrollment> {
  const response = await apiClient.get<LeadFollowUpEnrollment>(
    `/follow-up/enrollments/${id}`,
  );
  const body = response.data as { data?: LeadFollowUpEnrollment } & LeadFollowUpEnrollment;
  return body.data ?? body;
}

export async function cancelEnrollment(
  id: string,
  payload?: CancelEnrollmentPayload,
): Promise<LeadFollowUpEnrollment> {
  const response = await apiClient.patch<LeadFollowUpEnrollment>(
    `/follow-up/enrollments/${id}/cancel`,
    payload || {},
  );
  const body = response.data as { data?: LeadFollowUpEnrollment } & LeadFollowUpEnrollment;
  return body.data ?? body;
}

export async function pauseEnrollment(id: string): Promise<LeadFollowUpEnrollment> {
  const response = await apiClient.patch<LeadFollowUpEnrollment>(
    `/follow-up/enrollments/${id}/pause`,
    {},
  );
  const body = response.data as { data?: LeadFollowUpEnrollment } & LeadFollowUpEnrollment;
  return body.data ?? body;
}

export async function resumeEnrollment(id: string): Promise<LeadFollowUpEnrollment> {
  const response = await apiClient.patch<LeadFollowUpEnrollment>(
    `/follow-up/enrollments/${id}/resume`,
    {},
  );
  const body = response.data as { data?: LeadFollowUpEnrollment } & LeadFollowUpEnrollment;
  return body.data ?? body;
}

export async function updateEnrollmentStatus(
  id: string,
  status: "ACTIVE" | "PAUSED" | "CANCELLED",
  reason?: string,
): Promise<LeadFollowUpEnrollment> {
  if (status === "CANCELLED") {
    return cancelEnrollment(id, { cancellationReason: reason });
  }
  if (status === "PAUSED") {
    return pauseEnrollment(id);
  }
  if (status === "ACTIVE") {
    return resumeEnrollment(id);
  }
  const response = await apiClient.patch<LeadFollowUpEnrollment>(
    `/follow-up/enrollments/${id}/status`,
    { status, reason },
  );
  const body = response.data as { data?: LeadFollowUpEnrollment } & LeadFollowUpEnrollment;
  return body.data ?? body;
}


// ── Execution History (UC06) ───────────────────────────────────────────────

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

export async function retryFollowUpStep(
  execution: FollowUpExecution,
): Promise<ExecuteFollowUpResponse> {
  return executeFollowUp({
    enrollmentId: execution.enrollmentId,
    stepId: execution.stepId,
  });
}