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
import { useWorkspaceUser } from "@/components/notifications/useWorkspaceUser";

export default function CreateSegmentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const { activeUser, users, isLoading: usersLoading } = useWorkspaceUser();

  const createMutation = useMutation({
    mutationFn: (values: SegmentFormSubmitValues) => {
      if (!activeUser) {
        throw new Error(
          "Chưa có tài khoản workspace. Không thể tạo segment vì backend yêu cầu createdBy.",
        );
      }

      return createSegment({
        createdBy: activeUser.id,
        name: values.name,
        description: values.description,
        criteria: values.criteria,
        isActive: values.isActive,
      });
    },
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

      {usersLoading ? (
        <p className="text-sm text-gray-500">Đang tải tài khoản workspace…</p>
      ) : !activeUser ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Không tìm thấy tài khoản workspace nào. Backend yêu cầu `createdBy` là
          UUID của user hợp lệ (GET /users), nên cần có ít nhất một user.
        </p>
      ) : (
        <p className="text-xs text-gray-500">
          Segment sẽ được tạo bởi{" "}
          <span className="font-semibold text-[#17221c]">{activeUser.name}</span>{" "}
          ({users.length} tài khoản trong workspace).
        </p>
      )}

      <SegmentForm
        mode="create"
        serverError={serverError}
        isSubmitting={createMutation.isPending || !activeUser}
        onSubmit={(values) => {
          setServerError(null);
          createMutation.mutate(values);
        }}
      />
    </div>
  );
}