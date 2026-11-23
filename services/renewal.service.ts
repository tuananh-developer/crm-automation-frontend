import { apiClient } from "./api-client";
import type {
  ApproveRenewalAttemptInput,
  CreateContractInput,
  CustomerContract,
  RenewalApprovalTask,
  RenewalAttempt,
  SaveRenewalAttemptInput,
  UpdateContractInput,
} from "@/types/renewal";

function unwrapArray<T>(body: unknown): T[] {
  if (Array.isArray(body)) {
    return body as T[];
  }
  if (
    body &&
    typeof body === "object" &&
    Array.isArray((body as { data?: unknown }).data)
  ) {
    return (body as { data: T[] }).data;
  }
  return [];
}

export async function listContracts(params?: {
  customerId?: string;
  status?: string;
}): Promise<CustomerContract[]> {
  const response = await apiClient.get("/customer-contracts", { params });
  return unwrapArray<CustomerContract>(response.data);
}

export async function getDueContracts(
  days = 30,
): Promise<CustomerContract[]> {
  const response = await apiClient.get("/customer-contracts/due-for-renewal", {
    params: { days },
  });
  return unwrapArray<CustomerContract>(response.data);
}

export async function getContract(
  contractId: string,
): Promise<CustomerContract> {
  const response = await apiClient.get<CustomerContract>(
    `/customer-contracts/${encodeURIComponent(contractId)}`,
  );
  return response.data;
}

export async function createContract(
  payload: CreateContractInput,
): Promise<CustomerContract> {
  const response = await apiClient.post<CustomerContract>(
    "/customer-contracts",
    payload,
  );
  return response.data;
}

export async function updateContract(
  contractId: string,
  payload: UpdateContractInput,
): Promise<CustomerContract> {
  const response = await apiClient.patch<CustomerContract>(
    `/customer-contracts/${encodeURIComponent(contractId)}`,
    payload,
  );
  return response.data;
}

export async function listRenewalAttempts(
  contractId: string,
): Promise<RenewalAttempt[]> {
  const response = await apiClient.get(
    `/customer-contracts/${encodeURIComponent(contractId)}/renewal-attempts`,
  );
  return unwrapArray<RenewalAttempt>(response.data);
}

export async function createRenewalAttempt(
  contractId: string,
  payload: SaveRenewalAttemptInput,
): Promise<RenewalAttempt> {
  const response = await apiClient.post<RenewalAttempt>(
    `/customer-contracts/${encodeURIComponent(contractId)}/renewal-attempts`,
    payload,
  );
  return response.data;
}

export async function listApprovalTasks(
  contractId: string,
): Promise<RenewalApprovalTask[]> {
  const response = await apiClient.get(
    `/customer-contracts/${encodeURIComponent(contractId)}/approval-tasks`,
  );
  return unwrapArray<RenewalApprovalTask>(response.data);
}

export async function getRenewalAttempt(
  attemptId: string,
): Promise<RenewalAttempt> {
  const response = await apiClient.get<RenewalAttempt>(
    `/renewal-attempts/${encodeURIComponent(attemptId)}`,
  );
  return response.data;
}

export async function approveRenewalAttempt(
  attemptId: string,
  payload: ApproveRenewalAttemptInput,
): Promise<RenewalAttempt> {
  const response = await apiClient.post<RenewalAttempt>(
    `/renewal-attempts/${encodeURIComponent(attemptId)}/approve`,
    payload,
  );
  return response.data;
}
