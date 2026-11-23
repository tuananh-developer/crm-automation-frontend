/**
 * WF13 - Customer Contracts & Renewal Management types.
 * Mirrors NestJS CustomerContractsController and RenewalService contracts
 * (src/modules/renewal/customer-contracts.controller.ts).
 */

export type ContractStatus =
  | "ACTIVE"
  | "PENDING_RENEWAL"
  | "RENEWED"
  | "EXPIRED"
  | "CANCELLED"
  | string;

export interface CustomerContract {
  id: string;
  customerId: string;
  contractNumber: string;
  status: ContractStatus;
  startDate: string;
  endDate: string;
  renewalDate: string | null;
  amount: string | number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContractInput {
  customerId: string;
  contractNumber: string;
  status?: string;
  startDate: string;
  endDate: string;
  renewalDate?: string;
  amount?: number;
}

export interface UpdateContractInput {
  status?: string;
  endDate?: string;
  renewalDate?: string;
  amount?: number;
}

export type RenewalAttemptStatus =
  | "DRAFT"
  | "APPROVED"
  | "PROCESSING"
  | "SENT"
  | "RETRYABLE_FAILURE"
  | "PERMANENT_FAILURE"
  | "FAILED"
  | "UNKNOWN"
  | string;

export interface RenewalAttempt {
  id: string;
  contractId: string;
  customerId: string;
  renewalDate: string | null;
  urgency: string | null;
  recommendation: string | null;
  draftContent: string | null;
  status: RenewalAttemptStatus;
  idempotencyKey: string;
  aiModel: string | null;
  validationResult: Record<string, unknown> | null;
  errorCode: string | null;
  errorMessage: string | null;
  workflowExecutionId: string | null;
  communicationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaveRenewalAttemptInput {
  contractId: string;
  customerId: string;
  renewalDate?: string;
  urgency?: string;
  recommendation?: string;
  draftContent?: string;
  idempotencyKey: string;
  aiModel?: string;
}

export interface ApproveRenewalAttemptInput {
  consentGranted: boolean;
  templateApproved: boolean;
  policyApproved: boolean;
  comment?: string;
}

export interface RenewalApprovalTask {
  id: string;
  customerId: string;
  taskType: string;
  status: string;
  priority: string;
  idempotencyKey: string;
  dueAt: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}
