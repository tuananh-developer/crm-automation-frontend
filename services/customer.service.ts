import { apiClient } from "./api-client";
import type {
  Customer,
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
