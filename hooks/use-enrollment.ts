import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSequences,
  getEnrollmentsByLead,
  enrollLead,
  updateEnrollmentStatus,
} from "@/services/follow-up.service";
import type {
  EnrollLeadPayload,
  FollowUpSequence,
  LeadFollowUpEnrollment,
} from "@/types/follow-up";

/**
 * Lấy danh sách sequence đang active để đưa vào dropdown ghi danh (UC05).
 */
export function useActiveSequences() {
  return useQuery<FollowUpSequence[]>({
    queryKey: ["active-sequences"],
    queryFn: () => getSequences("ACTIVE"),
  });
}

/**
 * Lấy danh sách các sequence/enrollments mà lead này đang hoặc đã tham gia (UC05).
 */
export function useLeadEnrollments(leadId?: string) {
  return useQuery<LeadFollowUpEnrollment[]>({
    queryKey: ["lead-enrollments", leadId],
    queryFn: () => (leadId ? getEnrollmentsByLead(leadId) : Promise.resolve([])),
    enabled: Boolean(leadId),
  });
}

/**
 * Mutation ghi danh lead vào sequence (UC05).
 * Tự động làm mới cache của lead-enrollments và danh sách enrollments.
 */
export function useEnrollLead() {
  const queryClient = useQueryClient();

  return useMutation<LeadFollowUpEnrollment, Error, EnrollLeadPayload>({
    mutationFn: (payload: EnrollLeadPayload) => enrollLead(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["lead-enrollments", variables.leadId],
      });
      queryClient.invalidateQueries({
        queryKey: ["enrollments"],
      });
    },
  });
}

export interface UpdateEnrollmentStatusPayload {
  id: string;
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
  reason?: string;
  leadId?: string;
}

/**
 * Mutation cập nhật trạng thái enrollment (PAUSE / RESUME / CANCEL) (UC05).
 * Tự động làm mới cache query để giao diện đồng bộ tức thì.
 */
export function useUpdateEnrollmentStatus() {
  const queryClient = useQueryClient();

  return useMutation<
    LeadFollowUpEnrollment,
    Error,
    UpdateEnrollmentStatusPayload
  >({
    mutationFn: ({ id, status, reason }: UpdateEnrollmentStatusPayload) =>
      updateEnrollmentStatus(id, status, reason),
    onSuccess: (_data, variables) => {
      if (variables.leadId) {
        queryClient.invalidateQueries({
          queryKey: ["lead-enrollments", variables.leadId],
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: ["lead-enrollments"],
        });
      }
      queryClient.invalidateQueries({
        queryKey: ["enrollments"],
      });
    },
  });
}
