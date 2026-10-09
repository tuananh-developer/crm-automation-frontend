/**
 * UC05 & UC06 - Follow-up Sequences, Step Builder & Execution History Types.
 *
 * Shapes mirror the NestJS backend exactly:
 *  - FollowUpSequence (FollowUpSequenceStatus)
 *  - FollowUpStep (Channel, ActionType, delayMinutes, templates, conditions, metadata)
 *  - LeadFollowUpEnrollment (EnrollmentStatus)
 *  - FollowUpExecution (FollowUpExecutionStatus)
 */

// ── Status Enums & Unions ──────────────────────────────────────────────────

export type SequenceStatus =
  | "ACTIVE"
  | "DRAFT"
  | "PAUSED"
  | "COMPLETED"
  | "ARCHIVED";

export type FollowUpChannel =
  | "EMAIL"
  | "SMS"
  | "CALL"
  | "TASK"
  | "WEBHOOK"
  | "MESSAGE";

export type StepActionType =
  | "SEND_EMAIL"
  | "SEND_SMS"
  | "SCHEDULE_CALL"
  | "LOG_CALL"
  | "CREATE_TASK"
  | "TRIGGER_WEBHOOK";

export type EnrollmentStatus =
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED";

export type FollowUpExecutionStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCESS"
  | "FAILED"
  | "RETRYING"
  | "SKIPPED";

// ── Entity Interfaces ──────────────────────────────────────────────────────

export interface FollowUpStep {
  id: string;
  sequenceId: string;
  stepOrder: number;
  delayMinutes: number;
  channel: FollowUpChannel | string;
  actionType: StepActionType | string;
  subjectTemplate: string | null;
  contentTemplate: string | null;
  conditions: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FollowUpSequence {
  id: string;
  name: string;
  description: string | null;
  status: SequenceStatus;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  steps?: FollowUpStep[];
  creator?: {
    id: string;
    email?: string;
    fullName?: string;
    name?: string;
  };
}

export interface LeadFollowUpEnrollment {
  id: string;
  leadId: string;
  sequenceId: string;
  currentStepId?: string | null;
  status: EnrollmentStatus;
  currentStepOrder?: number | null;
  startedAt: string | null;
  pausedAt?: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason?: string | null;
  cancelReason?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  sequence?: FollowUpSequence;
  currentStep?: FollowUpStep | null;
  lead?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    companyName: string;
    status?: string;
  };
  executions?: FollowUpExecution[];
}

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

// ── DTOs & Payloads ────────────────────────────────────────────────────────

export interface CreateSequenceDto {
  name: string;
  description?: string;
  status?: SequenceStatus;
  createdBy?: string;
}

export interface UpdateSequenceDto {
  name?: string;
  description?: string;
  status?: SequenceStatus;
  updatedBy?: string;
}

export interface CreateStepDto {
  stepOrder: number;
  delayMinutes?: number;
  channel: string;
  actionType: string;
  subjectTemplate?: string;
  contentTemplate?: string;
  conditions?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  isActive?: boolean;
}

export interface UpdateStepDto {
  stepOrder?: number;
  delayMinutes?: number;
  channel?: string;
  actionType?: string;
  subjectTemplate?: string;
  contentTemplate?: string;
  conditions?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  isActive?: boolean;
}

export interface EnrollLeadPayload {
  leadId: string;
  sequenceId: string;
  assignedBy?: string;
}

export interface CancelEnrollmentPayload {
  cancellationReason?: string;
}

export interface ExecuteFollowUpPayload {
  enrollmentId: string;
  stepId?: string;
}

export interface ExecuteFollowUpResponse {
  execution: FollowUpExecution;
  status: FollowUpExecutionStatus;
  retryCount: number;
  message: string;
}

export interface FollowUpExecutionQuery {
  enrollmentId?: string;
  stepId?: string;
  status?: FollowUpExecutionStatus;
}

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