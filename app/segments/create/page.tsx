"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getApiErrorMessage } from "@/services/api-client";
import { createSegment } from "@/services/segment.service";
import {
  SegmentForm,
  type SegmentFormSubmitValues,
} from "@/components/segments/SegmentForm";

export default function CreateSegmentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (values: SegmentFormSubmitValues) =>
      createSegment({
        name: values.name,
        description: values.description,
        criteria: values.criteria,
        isActive: values.isActive,
      }),
    onSuccess: async (segment) => {
      await queryClient.invalidateQueries({ queryKey: ["segments"] });
      router.push("/segments");
      router.refresh();
      void segment;
    },
    onError: (error) => setServerError(getApiErrorMessage(error)),
  });

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-bold">Create Segment</h2>
        <p className="text-sm text-gray-500">
          Define the criteria used by RULE evaluation or the AI prompt context.
        </p>
      </div>

      <SegmentForm
        mode="create"
        serverError={serverError}
        isSubmitting={createMutation.isPending}
        onSubmit={(values) => {
          setServerError(null);
          createMutation.mutate(values);
        }}
      />
    </div>
  );
}
