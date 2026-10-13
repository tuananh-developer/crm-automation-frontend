import { apiClient } from "./api-client";
import type {
  CreateScanRequest,
  DataCleaningScanResponse,
  ApplyCleaningRequest,
  ApplyCleaningResponse,
} from "@/types/data-cleaning";

export const dataCleaningService = {
  /**
   * Initiates a new data cleaning scan for leads
   */
  async startScan(
    req: CreateScanRequest,
  ): Promise<{ workflowRunId: string; status: string; message: string }> {
    const response = await apiClient.post<{
      workflowRunId: string;
      status: string;
      message: string;
    }>("/data-cleaning/scans", req);
    return response.data;
  },

  /**
   * Fetches scan status and findings report
   */
  async getScan(workflowRunId: string): Promise<DataCleaningScanResponse> {
    const response = await apiClient.get<DataCleaningScanResponse>(
      `/data-cleaning/scans/${workflowRunId}`,
    );
    return response.data;
  },

  /**
   * Applies approved remediation proposals within transaction
   */
  async applyCleaning(
    workflowRunId: string,
    req: ApplyCleaningRequest,
  ): Promise<ApplyCleaningResponse> {
    const response = await apiClient.post<ApplyCleaningResponse>(
      `/data-cleaning/scans/${workflowRunId}/apply`,
      req,
    );
    return response.data;
  },
};
