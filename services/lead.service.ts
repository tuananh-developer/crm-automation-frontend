import axios from "axios";
import { apiClient } from "@/services/api-client";
import type {
  Lead,
  LeadEnrichment,
  LeadScore,
  LeadsListResponse,
  TriggerEnrichmentDto,
  TriggerScoringDto,
} from "@/types/lead";
import type { LeadFollowUpEnrollment } from "@/types/follow-up";

export const leadService = {
  /**
   * Fetch paginated list of leads
   */
  async getLeads(params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<LeadsListResponse> {
    const { data } = await apiClient.get<LeadsListResponse>("/leads", {
      params,
    });
    return data;
  },

  /**
   * Fetch single lead by UUID
   */
  async getLeadById(id: string): Promise<Lead> {
    const { data } = await apiClient.get<Lead>(`/leads/${id}`);
    return data;
  },

  /**
   * Get latest AI enrichment result for a lead
   */
  async getLatestEnrichment(leadId: string): Promise<LeadEnrichment | null> {
    try {
      const { data } = await apiClient.get<LeadEnrichment>(
        `/lead-intelligence/enrichments/${leadId}/latest`,
      );
      return data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  },

  /**
   * Get enrichment history for a lead
   */
  async getEnrichmentHistory(leadId: string): Promise<LeadEnrichment[]> {
    try {
      const { data } = await apiClient.get<LeadEnrichment[]>(
        `/lead-intelligence/enrichments/${leadId}`,
      );
      return data ?? [];
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return [];
      }
      throw err;
    }
  },

  /**
   * Trigger AI Enrichment for a lead (UC03)
   */
  async triggerEnrichment(
    leadId: string,
    dto?: TriggerEnrichmentDto,
  ): Promise<{ message: string; enrichment: LeadEnrichment; lead: Lead }> {
    const { data } = await apiClient.post(
      `/lead-intelligence/enrich/${leadId}`,
      dto ?? { provider: "mock" },
    );
    return data;
  },

  /**
   * Get latest AI score for a lead (UC04)
   */
  async getLatestScore(leadId: string): Promise<LeadScore | null> {
    try {
      const { data } = await apiClient.get<LeadScore>(
        `/lead-intelligence/scores/${leadId}/latest`,
      );
      return data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  },

  /**
   * Get score history for a lead (UC04)
   */
  async getScoreHistory(leadId: string): Promise<LeadScore[]> {
    try {
      const { data } = await apiClient.get<LeadScore[]>(
        `/lead-intelligence/scores/${leadId}`,
      );
      return data ?? [];
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return [];
      }
      throw err;
    }
  },

  /**
   * Trigger AI Lead Scoring calculation (UC04)
   */
  async triggerScoring(
    leadId: string,
    dto?: TriggerScoringDto,
  ): Promise<{ message: string; score: LeadScore }> {
    const { data } = await apiClient.post(
      `/lead-intelligence/score/${leadId}`,
      dto ?? {},
    );
    return data;
  },

  /**
   * Get all follow-up enrollments for a lead (UC06)
   */
  async getEnrollmentsByLeadId(leadId: string): Promise<LeadFollowUpEnrollment[]> {
    const { data } = await apiClient.get<LeadFollowUpEnrollment[]>(
      `/follow-ups/enrollments/by-lead/${leadId}`,
    );
    return data ?? [];
  },

  /**
   * Get active follow-up enrollment for a lead (UC06)
   */
  async getActiveEnrollmentByLeadId(leadId: string): Promise<LeadFollowUpEnrollment | null> {
    try {
      const { data } = await apiClient.get<LeadFollowUpEnrollment | null>(
        `/follow-ups/enrollments/by-lead/${leadId}/active`,
      );
      return data ?? null;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  },
};
