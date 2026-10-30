import { apiClient } from "./api-client";
import type {
  Customer,
  CustomerDetail,
  CustomerListResponse,
} from "@/types/customer";
import type { Customer360Response } from "@/types/customer-360";

/**
 * UC09 & Topic 12 - Customer & Customer 360 API layer.
 */
export interface CustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

function unwrapList(response: { data?: unknown }): CustomerListResponse {
  const body = response.data as
    | CustomerListResponse
    | Customer[]
    | null;

  if (Array.isArray(body)) {
    return { data: body };
  }

  return { data: body?.data ?? [], meta: body?.meta };
}

export async function getCustomers(
  params: CustomerListParams = {},
): Promise<CustomerListResponse> {
  const response = await apiClient.get("/customers", { params });
  return unwrapList(response);
}

export async function getCustomer(id: string): Promise<CustomerDetail> {
  const response = await apiClient.get<CustomerDetail>(`/customers/${id}`);
  return response.data;
}

/**
 * T12-WF05: Fetch full aggregated Customer 360 profile and AI summary.
 */
export async function getCustomer360(id: string): Promise<Customer360Response> {
  const response = await apiClient.get<Customer360Response>(`/customers/${id}/360`);
  return response.data;
}

/**
 * T12-WF05: Initiate AI Customer 360 synthesis workflow (returns 202 Accepted).
 */
export async function triggerCustomer360(
  id: string,
): Promise<{ message: string; workflowRunId: string }> {
  const response = await apiClient.post<{ message: string; workflowRunId: string }>(
    `/customers/${id}/360/trigger`,
    {},
  );
  return response.data;
}

