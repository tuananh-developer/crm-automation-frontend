"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getApiErrorMessage } from "@/services/api-client";
import { getSegment, updateSegment } from "@/services/segment.service";
import {
  SegmentForm,
  type SegmentFormSubmitValues,
} from "@/components/segments/SegmentForm";
import { ErrorState, LoadingState } from "@/components/segments/States";
import { useWorkspaceUser } from "@/components/notifications/useWorkspaceUser";

export default function EditSegmentPage() {
  const params = useParams<{ id: string }>();
  const segmentId = params.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const { activeUser } = useWorkspaceUser();

  const segmentQuery = useQuery({
    queryKey: ["segments", segmentId],
    queryFn: () => getSegment(segmentId),
    enabled: Boolean(segmentId),
  });

  const updateMutation = useMutation({
    mutationFn: (values: SegmentFormSubmitValues) =>
      updateSegment(segmentId, {
        // The API records `updatedBy` from createdBy when it is provided.
        ...(activeUser ? { createdBy: activeUser.id } : {}),
        name: values.name,
        description: values.description,
        criteria: values.criteria,
        isActive: values.isActive,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["segments"] });
      router.push(`/segments/${segmentId}`);
      router.refresh();
    },
    onError: (error) => setServerError(getApiErrorMessage(error)),
  });

  if (segmentQuery.isLoading) {
    return <LoadingState label="Loading segment…" />;
  }

  if (segmentQuery.isError) {
    return (
      <ErrorState
        message={getApiErrorMessage(segmentQuery.error)}
        onRetry={() => segmentQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-4">
      <nav className="text-sm text-gray-500">
        <Link href="/segments" className="font-medium hover:text-[#173b2b]">
          Segments
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/segments/${segmentId}`}
          className="font-medium hover:text-[#173b2b]"
        >
          {segmentQuery.data?.name ?? "Detail"}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[#17221c]">Edit</span>
      </nav>

      <div className="space-y-1">
        <h2 className="text-lg font-bold">Edit Segment</h2>
        <p className="text-sm text-gray-500">
          Update criteria, assignment type or status.
        </p>
      </div>

      <SegmentForm
        mode="edit"
        segment={segmentQuery.data}
        serverError={serverError}
        isSubmitting={updateMutation.isPending}
        onSubmit={(values) => {
          setServerError(null);
          updateMutation.mutate(values);
        }}
      />
    </div>
  );
}