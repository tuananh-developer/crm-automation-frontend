/**
 * UC06 - Execute Follow-up: frontend types.
 *
 * Shapes mirror the NestJS backend exactly:
 *  - GET  /api/v1/follow-ups/executions  -> FollowUpExecution[]
 *  - POST /api/v1/follow-ups/executions  -> ExecuteFollowUpResult
 *  - GET  /api/v1/follow-ups/enrollments/by-lead/:leadId  -> LeadFollowUpEnrollment[]
 *  - GET  /api/v1/follow-ups/enrollments/by-lead/:leadId/active  -> LeadFollowUpEnrollment | null
 *  (src/modules/follow-up/follow-up.controller.ts / follow-up.service.ts)
 */

/** Value of `lead_follow_up_enrollments.status` (EnrollmentStatus enum backend). */
export type EnrollmentStatus =
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED";

/** Lead Follow-up Enrollment entity. */
export interface LeadFollowUpEnrollment {
  id: string;
  leadId: string;
  sequenceId: string;
  currentStepId: string | null;
  status: EnrollmentStatus;
  startedAt: string | null;
  pausedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  assignedBy: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
  sequence?: {
    id: string;
    name: string;
    description: string | null;
  };
  currentStep?: {
    id: string;
    name: string;
    order: number;
  } | null;
}

/** Value of `follow_up_executions.status` (ExecutionStatus enum backend). */
export type FollowUpExecutionStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCESS"
  | "FAILED"
  | "RETRYING"
  | "SKIPPED";

export interface FollowUpExecution {
  id: string;
  enrollmentId: string;
  stepId: string;
  status: FollowUpExecutionStatus;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  providerMessageId: string | null;
  requestPayload: Record<string, unknown> | null;
  responsePayload: Record<string, unknown> | null;
  errorMessage: string | null;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Body of POST /api/v1/follow-ups/executions (ExecuteFollowUpDto). */
export interface ExecuteFollowUpPayload {
  enrollmentId: string;
  stepId?: string;
}

/** Response of POST /api/v1/follow-ups/executions. */
export interface ExecuteFollowUpResponse {
  execution: FollowUpExecution;
  status: FollowUpExecutionStatus;
  retryCount: number;
  message: string;
}

/** Query of GET /api/v1/follow-ups/executions (QueryFollowUpExecutionDto). */
export interface FollowUpExecutionQuery {
  enrollmentId?: string;
  stepId?: string;
  status?: FollowUpExecutionStatus;
}

/** Fields the backend stores in `request_payload` when executing a step. */
export interface FollowUpRequestPayload {
  executionId?: string;
  enrollmentId?: string;
  stepId?: string;
  leadId?: string;
  channel?: string;
  actionType?: string;
  stepOrder?: number;
  recipient?: string;
  subject?: string | null;
  message?: string;
  attempt?: number;
}