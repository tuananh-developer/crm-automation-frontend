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
 *   GET    /sequences?status                    -> FollowUpSequence[]
 *   POST   /sequences                           -> FollowUpSequence
 *   GET    /sequences/:id                       -> FollowUpSequence (with steps)
 *   PATCH  /sequences/:id                       -> FollowUpSequence
 *   DELETE /sequences/:id                       -> FollowUpSequence
 *   POST   /sequences/:id/steps                 -> FollowUpStep
 *   GET    /sequences/:id/steps                 -> FollowUpStep[]
 *   PATCH  /sequences/steps/:stepId             -> FollowUpStep
 *   POST   /sequences/enroll                    -> LeadFollowUpEnrollment
 *   GET    /sequences/enrollments               -> LeadFollowUpEnrollment[]
 *   GET    /sequences/enrollments/lead/:leadId  -> LeadFollowUpEnrollment[]
 *   PATCH  /sequences/enrollments/:id/cancel    -> LeadFollowUpEnrollment
 *   PATCH  /sequences/enrollments/:id/pause     -> LeadFollowUpEnrollment
 *   PATCH  /sequences/enrollments/:id/resume    -> LeadFollowUpEnrollment
 *   GET    /follow-ups/executions               -> FollowUpExecution[]
 *   POST   /follow-ups/executions               -> ExecuteFollowUpResult
 */

function is404(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "response" in err &&
    (err as { response?: { status?: number } }).response?.status === 404
  );
}

// ── Sequence Management (UC05) ─────────────────────────────────────────────

export async function getSequences(
  status?: SequenceStatus,
): Promise<FollowUpSequence[]> {
  try {
    const response = await apiClient.get<FollowUpSequence[]>("/sequences", {
      params: status ? { status } : undefined,
    });
    if (Array.isArray(response.data)) return response.data;
    const body = response.data as { data?: FollowUpSequence[] } | null;
    return body?.data ?? [];
  } catch (err) {
    if (!is404(err)) throw err;
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
}

export async function getSequenceById(id: string): Promise<FollowUpSequence> {
  try {
    const response = await apiClient.get<FollowUpSequence>(`/sequences/${id}`);
    const body = response.data as { data?: FollowUpSequence } & FollowUpSequence;
    return body.data ?? body;
  } catch (err) {
    if (!is404(err)) throw err;
    const response = await apiClient.get<FollowUpSequence>(
      `/follow-up/sequences/${id}`,
    );
    const body = response.data as { data?: FollowUpSequence } & FollowUpSequence;
    return body.data ?? body;
  }
}

export async function createSequence(
  dto: CreateSequenceDto,
): Promise<FollowUpSequence> {
  try {
    const response = await apiClient.post<FollowUpSequence>("/sequences", dto);
    const body = response.data as { data?: FollowUpSequence } & FollowUpSequence;
    return body.data ?? body;
  } catch (err) {
    if (!is404(err)) throw err;
    const response = await apiClient.post<FollowUpSequence>(
      "/follow-up/sequences",
      dto,
    );
    const body = response.data as { data?: FollowUpSequence } & FollowUpSequence;
    return body.data ?? body;
  }
}

export async function updateSequence(
  id: string,
  dto: UpdateSequenceDto,
): Promise<FollowUpSequence> {
  try {
    const response = await apiClient.patch<FollowUpSequence>(
      `/sequences/${id}`,
      dto,
    );
    const body = response.data as { data?: FollowUpSequence } & FollowUpSequence;
    return body.data ?? body;
  } catch (err) {
    if (!is404(err)) throw err;
    const response = await apiClient.patch<FollowUpSequence>(
      `/follow-up/sequences/${id}`,
      dto,
    );
    const body = response.data as { data?: FollowUpSequence } & FollowUpSequence;
    return body.data ?? body;
  }
}

export async function toggleSequenceActive(
  id: string,
  isActive: boolean,
): Promise<FollowUpSequence> {
  return updateSequence(id, { status: isActive ? "ACTIVE" : "PAUSED" });
}

export async function deleteSequence(
  id: string,
): Promise<{ success: boolean }> {
  try {
    await apiClient.delete(`/sequences/${id}`);
    return { success: true };
  } catch (err) {
    if (!is404(err)) throw err;
    try {
      await apiClient.delete(`/follow-up/sequences/${id}`);
      return { success: true };
    } catch {
      await updateSequence(id, { status: "ARCHIVED" as SequenceStatus });
      return { success: true };
    }
  }
}

// ── Step Management (UC05) ─────────────────────────────────────────────────

export async function getStepsBySequence(
  sequenceId: string,
): Promise<FollowUpStep[]> {
  try {
    const response = await apiClient.get<FollowUpStep[]>(
      `/sequences/${sequenceId}/steps`,
    );
    if (Array.isArray(response.data)) return response.data;
    const body = response.data as { data?: FollowUpStep[] } | null;
    return body?.data ?? [];
  } catch (err) {
    if (!is404(err)) throw err;
    const response = await apiClient.get<FollowUpStep[]>(
      `/follow-up/sequences/${sequenceId}/steps`,
    );
    if (Array.isArray(response.data)) return response.data;
    const body = response.data as { data?: FollowUpStep[] } | null;
    return body?.data ?? [];
  }
}

export async function createStep(
  sequenceId: string,
  dto: CreateStepDto,
): Promise<FollowUpStep> {
  try {
    const response = await apiClient.post<FollowUpStep>(
      `/sequences/${sequenceId}/steps`,
      dto,
    );
    const body = response.data as { data?: FollowUpStep } & FollowUpStep;
    return body.data ?? body;
  } catch (err) {
    if (!is404(err)) throw err;
    const response = await apiClient.post<FollowUpStep>(
      `/follow-up/sequences/${sequenceId}/steps`,
      dto,
    );
    const body = response.data as { data?: FollowUpStep } & FollowUpStep;
    return body.data ?? body;
  }
}

export async function updateStep(
  stepId: string,
  dto: UpdateStepDto,
): Promise<FollowUpStep> {
  try {
    const response = await apiClient.patch<FollowUpStep>(
      `/sequences/steps/${stepId}`,
      dto,
    );
    const body = response.data as { data?: FollowUpStep } & FollowUpStep;
    return body.data ?? body;
  } catch (err) {
    if (!is404(err)) throw err;
    const response = await apiClient.patch<FollowUpStep>(
      `/follow-up/steps/${stepId}`,
      dto,
    );
    const body = response.data as { data?: FollowUpStep } & FollowUpStep;
    return body.data ?? body;
  }
}

// ── Lead Follow-Up Enrollment (UC05) ───────────────────────────────────────

export async function enrollLead(
  payload: EnrollLeadPayload,
): Promise<LeadFollowUpEnrollment> {
  let resData: unknown;
  try {
    const response = await apiClient.post<
      | { message?: string; enrollment?: LeadFollowUpEnrollment; data?: LeadFollowUpEnrollment }
      | LeadFollowUpEnrollment
    >("/sequences/enroll", payload);
    resData = response.data;
  } catch (err) {
    if (!is404(err)) throw err;
    const response = await apiClient.post<
      | { message?: string; enrollment?: LeadFollowUpEnrollment; data?: LeadFollowUpEnrollment }
      | LeadFollowUpEnrollment
    >("/follow-up/enroll", payload);
    resData = response.data;
  }

  if (resData && typeof resData === "object" && "enrollment" in resData && (resData as { enrollment?: LeadFollowUpEnrollment }).enrollment) {
    return (resData as { enrollment: LeadFollowUpEnrollment }).enrollment;
  }
  if (resData && typeof resData === "object" && "data" in resData && (resData as { data?: LeadFollowUpEnrollment }).data) {
    return (resData as { data: LeadFollowUpEnrollment }).data;
  }
  return resData as LeadFollowUpEnrollment;
}

export async function getEnrollments(params?: {
  leadId?: string;
  sequenceId?: string;
  status?: string;
}): Promise<LeadFollowUpEnrollment[]> {
  try {
    const response = await apiClient.get<LeadFollowUpEnrollment[]>(
      "/sequences/enrollments",
      { params },
    );
    if (Array.isArray(response.data)) return response.data;
    const body = response.data as { data?: LeadFollowUpEnrollment[] } | null;
    return body?.data ?? [];
  } catch (err) {
    if (!is404(err)) throw err;
    const response = await apiClient.get<LeadFollowUpEnrollment[]>(
      "/follow-up/enrollments",
      { params },
    );
    if (Array.isArray(response.data)) return response.data;
    const body = response.data as { data?: LeadFollowUpEnrollment[] } | null;
    return body?.data ?? [];
  }
}

export async function getEnrollmentsByLead(
  leadId: string,
): Promise<LeadFollowUpEnrollment[]> {
  try {
    const response = await apiClient.get<LeadFollowUpEnrollment[]>(
      `/sequences/enrollments/lead/${leadId}`,
    );
    if (Array.isArray(response.data)) return response.data;
    const body = response.data as { data?: LeadFollowUpEnrollment[] } | null;
    return body?.data ?? [];
  } catch (err) {
    if (!is404(err)) throw err;
    return getEnrollments({ leadId });
  }
}

export async function getEnrollmentById(
  id: string,
): Promise<LeadFollowUpEnrollment> {
  try {
    const response = await apiClient.get<LeadFollowUpEnrollment>(
      `/sequences/enrollments/${id}`,
    );
    const body = response.data as { data?: LeadFollowUpEnrollment } & LeadFollowUpEnrollment;
    return body.data ?? body;
  } catch (err) {
    if (!is404(err)) throw err;
    const response = await apiClient.get<LeadFollowUpEnrollment>(
      `/follow-up/enrollments/${id}`,
    );
    const body = response.data as { data?: LeadFollowUpEnrollment } & LeadFollowUpEnrollment;
    return body.data ?? body;
  }
}

export async function cancelEnrollment(
  id: string,
  payload?: CancelEnrollmentPayload,
): Promise<LeadFollowUpEnrollment> {
  try {
    const response = await apiClient.patch<LeadFollowUpEnrollment>(
      `/sequences/enrollments/${id}/cancel`,
      payload || {},
    );
    const body = response.data as { data?: LeadFollowUpEnrollment } & LeadFollowUpEnrollment;
    return body.data ?? body;
  } catch (err) {
    if (!is404(err)) throw err;
    const response = await apiClient.patch<LeadFollowUpEnrollment>(
      `/follow-up/enrollments/${id}/cancel`,
      payload || {},
    );
    const body = response.data as { data?: LeadFollowUpEnrollment } & LeadFollowUpEnrollment;
    return body.data ?? body;
  }
}

export async function pauseEnrollment(id: string): Promise<LeadFollowUpEnrollment> {
  try {
    const response = await apiClient.patch<LeadFollowUpEnrollment>(
      `/sequences/enrollments/${id}/pause`,
      {},
    );
    const body = response.data as { data?: LeadFollowUpEnrollment } & LeadFollowUpEnrollment;
    return body.data ?? body;
  } catch (err) {
    if (!is404(err)) throw err;
    const response = await apiClient.patch<LeadFollowUpEnrollment>(
      `/follow-up/enrollments/${id}/pause`,
      {},
    );
    const body = response.data as { data?: LeadFollowUpEnrollment } & LeadFollowUpEnrollment;
    return body.data ?? body;
  }
}

export async function resumeEnrollment(id: string): Promise<LeadFollowUpEnrollment> {
  try {
    const response = await apiClient.patch<LeadFollowUpEnrollment>(
      `/sequences/enrollments/${id}/resume`,
      {},
    );
    const body = response.data as { data?: LeadFollowUpEnrollment } & LeadFollowUpEnrollment;
    return body.data ?? body;
  } catch (err) {
    if (!is404(err)) throw err;
    const response = await apiClient.patch<LeadFollowUpEnrollment>(
      `/follow-up/enrollments/${id}/resume`,
      {},
    );
    const body = response.data as { data?: LeadFollowUpEnrollment } & LeadFollowUpEnrollment;
    return body.data ?? body;
  }
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
  try {
    const response = await apiClient.patch<LeadFollowUpEnrollment>(
      `/sequences/enrollments/${id}/status`,
      { status, reason },
    );
    const body = response.data as { data?: LeadFollowUpEnrollment } & LeadFollowUpEnrollment;
    return body.data ?? body;
  } catch (err) {
    if (!is404(err)) throw err;
    const response = await apiClient.patch<LeadFollowUpEnrollment>(
      `/follow-up/enrollments/${id}/status`,
      { status, reason },
    );
    const body = response.data as { data?: LeadFollowUpEnrollment } & LeadFollowUpEnrollment;
    return body.data ?? body;
  }
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