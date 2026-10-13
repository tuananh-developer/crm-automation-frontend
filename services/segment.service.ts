import { apiClient } from "./api-client";
import type {
  CustomerSegmentAssignment,
  EvaluateBulkPayload,
  EvaluateBulkResult,
  EvaluateCustomerPayload,
  PaginatedResponse,
  Segment,
  SegmentAssignmentType,
  SegmentCriteria,
  SegmentCustomerListResponse,
  SegmentEvaluationResult,
  SegmentListParams,
  SegmentPayload,
} from "@/types/segment";

/**
 * UC09 - Customer Segmentation API layer.
 *
 * Endpoints follow the NestJS conventions already used by the backend
 * (`@Controller('segments')`, global prefix `api/v1`).
 * Every path below was verified against the running backend; the query
 * parameters are restricted to what `QuerySegmentDto` whitelists because the
 * API runs with `forbidNonWhitelisted` (an unknown param returns HTTP 400).
 */

export type { SegmentListParams };

export interface SegmentCustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
}

function unwrapList<T>(response: { data?: unknown }): PaginatedResponse<T> {
  const body = response.data as
    | PaginatedResponse<T>
    | T[]
    | undefined;

  if (Array.isArray(body)) {
    return {
      data: body as T[],
      meta: {
        page: 1,
        limit: body.length,
        total: body.length,
        totalPages: 1,
      },
    };
  }

  const data = (body?.data ?? []) as T[];
  const meta = body?.meta ?? {
    page: 1,
    limit: data.length || 10,
    total: data.length,
    totalPages: 1,
  };

  return {
    data,
    meta,
  };
}

export async function getSegments(
  params: SegmentListParams = {},
): Promise<PaginatedResponse<Segment>> {
  const response = await apiClient.get("/segments", { params });
  // Backend returns PaginatedResponseDto<Segment>
  const body = response.data as PaginatedResponse<Segment>;
  return body;
}

export async function getSegment(id: string): Promise<Segment> {
  const response = await apiClient.get<Segment>(`/segments/${id}`);
  return response.data;
}

export async function createSegment(payload: SegmentPayload): Promise<Segment> {
  const response = await apiClient.post<Segment>("/segments", payload);
  return response.data;
}

export async function updateSegment(
  id: string,
  payload: Partial<SegmentPayload>,
): Promise<Segment> {
  const response = await apiClient.patch<Segment>(`/segments/${id}`, payload);
  return response.data;
}

export async function activateSegment(id: string): Promise<Segment> {
  const response = await apiClient.patch<Segment>(`/segments/${id}`, {
    isActive: true,
  });
  return response.data;
}

export async function deactivateSegment(id: string): Promise<Segment> {
  const response = await apiClient.patch<Segment>(`/segments/${id}`, {
    isActive: false,
  });
  return response.data;
}

export async function deleteSegment(id: string): Promise<void> {
  await apiClient.delete(`/segments/${id}`);
}

export async function getSegmentCustomers(
  segmentId: string,
  params: SegmentCustomerListParams = {},
): Promise<SegmentCustomerListResponse> {
  const response = await apiClient.get(`/segments/${segmentId}/customers`, {
    params,
  });
  return unwrapList<CustomerSegmentAssignment>(response);
}

export async function evaluateCustomer(
  segmentId: string,
  payload: EvaluateCustomerPayload,
): Promise<SegmentEvaluationResult> {
  const response = await apiClient.post<SegmentEvaluationResult>(
    `/segments/${segmentId}/evaluate`,
    payload,
  );
  return response.data;
}

/**
 * Bulk evaluation. The API only supports `RULE`: sending `AI` returns
 * HTTP 400 "AI segmentation is not configured for this backend".
 */
export async function evaluateSegmentCustomers(
  segmentId: string,
  payload: EvaluateBulkPayload,
): Promise<EvaluateBulkResult> {
  const response = await apiClient.post<EvaluateBulkResult>(
    `/segments/${segmentId}/evaluate-all`,
    payload,
  );
  return response.data;
}

export type { Segment, SegmentAssignmentType, SegmentCriteria };