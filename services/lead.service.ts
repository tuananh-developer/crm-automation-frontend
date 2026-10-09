import axios from "axios";
import { apiClient } from "@/services/api-client";
import type {
  ConvertLeadDto,
  ConvertLeadResult,
  CreateLeadDto,
  CreateLeadSourceDto,
  Lead,
  LeadEnrichment,
  LeadQualification,
  LeadQueryParams,
  LeadScore,
  LeadSource,
  LeadsListResponse,
  TriggerEnrichmentDto,
  TriggerQualificationDto,
  TriggerScoringDto,
  UpdateLeadDto,
} from "@/types/lead";
import type { LeadFollowUpEnrollment } from "@/types/follow-up";

export const leadService = {
  /**
   * Fetch paginated list of leads
   */
  async getLeads(params?: LeadQueryParams): Promise<LeadsListResponse> {
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
   * Create a new Lead (UC01)
   */
  async createLead(dto: CreateLeadDto): Promise<Lead> {
    const { data } = await apiClient.post<Lead>("/leads", dto);
    return data;
  },

  /**
   * Update an existing Lead (UC01)
   */
  async updateLead(id: string, dto: UpdateLeadDto): Promise<Lead> {
    const { data } = await apiClient.patch<Lead>(`/leads/${id}`, dto);
    return data;
  },

  /**
   * Soft delete a Lead (UC01)
   */
  async deleteLead(id: string): Promise<void> {
    await apiClient.delete(`/leads/${id}`);
  },

  /**
   * Fetch all Lead Sources (UC01)
   */
  async getLeadSources(): Promise<LeadSource[]> {
    const { data } = await apiClient.get<LeadSource[]>("/lead-sources");
    return Array.isArray(data) ? data : [];
  },

  /**
   * Create a new Lead Source
   */
  async createLeadSource(dto: CreateLeadSourceDto): Promise<LeadSource> {
    const { data } = await apiClient.post<LeadSource>("/lead-sources", dto);
    return data;
  },

  /**
   * Get latest AI Qualification assessment for a lead (UC02)
   */
  async getLatestQualification(leadId: string): Promise<LeadQualification | null> {
    try {
      const { data } = await apiClient.get<LeadQualification>(
        `/lead-intelligence/qualifications/${leadId}/latest`,
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

  /**
   * Get all qualification assessment history for a lead (UC02)
   */
  async getQualificationHistory(leadId: string): Promise<LeadQualification[]> {
    try {
      const { data } = await apiClient.get<LeadQualification[]>(
        `/lead-intelligence/qualifications/${leadId}`,
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
   * Trigger AI Lead Qualification workflow (UC02)
   */
  async triggerQualification(
    leadId: string,
    dto?: TriggerQualificationDto,
  ): Promise<{ message: string; runId?: string }> {
    const { data } = await apiClient.post(
      `/lead-intelligence/qualify/${leadId}`,
      dto ?? {},
    );
    return data;
  },

  /**
   * Convert a Qualified Lead into a Customer (UC08)
   */
  async convertLead(
    id: string,
    dto: ConvertLeadDto,
  ): Promise<ConvertLeadResult> {
    const { data } = await apiClient.post<ConvertLeadResult>(
      `/leads/${id}/convert`,
      dto,
    );
    return data;
  },
};

