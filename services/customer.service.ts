import { apiClient } from "./api-client";
import type {
  AccountHealthSnapshot,
  Customer,
  CustomerChurnAssessment,
  CustomerDetail,
  CustomerListResponse,
} from "@/types/customer";

/**
 * UC09 - Customer API layer.
 *
 * Backend endpoints (NestJS CustomersController, prefix /api/v1):
 *   GET /customers?page&limit&search&status -> { data: Customer[], meta }
 *   GET /customers/:id                       -> CustomerDetail
 *
 * The backend wraps list results in a `{ data, meta }` envelope, unlike the
 * review/follow-up endpoints that answer with a bare array.
 */

export interface CustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  isStrategic?: boolean;
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
 * WF06 - Customer churn assessment history.
 * Backend: GET /api/v1/customers/:customerId/churn-assessments
 */
export async function getCustomerChurnAssessments(
  customerId: string,
): Promise<CustomerChurnAssessment[]> {
  const response = await apiClient.get<
    CustomerChurnAssessment[] | { data?: CustomerChurnAssessment[] }
  >(`/customers/${encodeURIComponent(customerId)}/churn-assessments`);
  const body = response.data;
  if (Array.isArray(body)) {
    return body;
  }
  return Array.isArray(body?.data) ? body.data : [];
}

/**
 * WF15 - Strategic Account Health snapshots.
 * Backend: GET /api/v1/account-health/snapshots/:customerId
 * Falls back gracefully to an empty array if the route requires internal service auth or is unavailable.
 */
export async function getCustomerHealthSnapshots(
  customerId: string,
): Promise<AccountHealthSnapshot[]> {
  try {
    const response = await apiClient.get<
      AccountHealthSnapshot[] | { data?: AccountHealthSnapshot[] }
    >(`/account-health/snapshots/${encodeURIComponent(customerId)}`);
    const body = response.data;
    if (Array.isArray(body)) {
      return body;
    }
    return Array.isArray(body?.data) ? body.data : [];
  } catch {
    return [];
  }
}
