"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getApiErrorMessage } from "@/services/api-client";
import {
  activateSegment,
  deactivateSegment,
  deleteSegment,
  getSegments,
  type SegmentListParams,
} from "@/services/segment.service";
import { ConfirmDialog } from "@/components/segments/ConfirmDialog";
import { Notice } from "@/components/segments/States";
import { SegmentTable } from "@/components/segments/SegmentTable";
import type { Segment } from "@/types/segment";

type PendingAction = {
  type: "activate" | "deactivate" | "delete";
  segment: Segment;
} | null;

export default function SegmentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");
  const [page, setPage] = React.useState(1);
  const [notice, setNotice] = React.useState<{
    tone: "success" | "danger";
    message: string;
  } | null>(null);
  const [pendingAction, setPendingAction] = React.useState<PendingAction>(null);

  const params = React.useMemo<SegmentListParams>(
    () => ({
      page,
      limit: 10,
      search: search.trim() || undefined,
      isActive: statusFilter === "ALL" ? undefined : statusFilter === "ACTIVE",
    }),
    [page, search, statusFilter],
  );

  const segmentsQuery = useQuery({
    queryKey: ["segments", params],
    queryFn: () => getSegments(params),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["segments"] });

  const toggleMutation = useMutation({
    mutationFn: ({ segment, nextState }: { segment: Segment; nextState: boolean }) =>
      nextState
        ? activateSegment(segment.id)
        : deactivateSegment(segment.id),
    onSuccess: async (segment) => {
      await invalidate();
      setNotice({
        tone: "success",
        message: `Segment '${segment.name}' is now ${
          segment.isActive ? "ACTIVE" : "INACTIVE"
        }.`,
      });
      setPendingAction(null);
    },
    onError: (error) => {
      setNotice({ tone: "danger", message: getApiErrorMessage(error) });
      setPendingAction(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (segment: Segment) => deleteSegment(segment.id),
    onSuccess: async (_result, segment) => {
      await invalidate();
      setNotice({
        tone: "success",
        message: `Segment '${segment.name}' has been deleted.`,
      });
      setPendingAction(null);
    },
    onError: (error) => {
      setNotice({ tone: "danger", message: getApiErrorMessage(error) });
      setPendingAction(null);
    },
  });

  const confirmPendingAction = () => {
    if (!pendingAction) return;

    if (pendingAction.type === "delete") {
      deleteMutation.mutate(pendingAction.segment);
      return;
    }

    toggleMutation.mutate({
      segment: pendingAction.segment,
      nextState: pendingAction.type === "activate",
    });
  };

  const isMutating =
    toggleMutation.isPending ||
    deleteMutation.isPending ||
    (segmentsQuery.isFetching && Boolean(pendingAction));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold">Segment management</h2>
        <p className="text-sm text-gray-500">
          Group customers with RULE criteria or AI evaluation.
        </p>
      </div>

      {notice ? (
        <Notice tone={notice.tone}>{notice.message}</Notice>
      ) : null}

      <SegmentTable
        segments={segmentsQuery.data?.data ?? []}
        meta={segmentsQuery.data?.meta}
        isLoading={segmentsQuery.isLoading}
        error={segmentsQuery.isError ? getApiErrorMessage(segmentsQuery.error) : null}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
        page={page}
        onPageChange={setPage}
        pendingId={pendingAction?.segment.id ?? null}
        onView={(segment) => router.push(`/segments/${segment.id}`)}
        onEdit={(segment) => router.push(`/segments/${segment.id}/edit`)}
        onToggle={(segment) =>
          setPendingAction({
            type: segment.isActive ? "deactivate" : "activate",
            segment,
          })
        }
        onDelete={(segment) => setPendingAction({ type: "delete", segment })}
        onRetry={() => segmentsQuery.refetch()}
      />

      <ConfirmDialog
        open={pendingAction !== null}
        title={
          pendingAction?.type === "delete"
            ? "Delete segment"
            : pendingAction?.type === "activate"
              ? "Activate segment"
              : "Deactivate segment"
        }
        description={
          pendingAction
            ? `Segment '${pendingAction.segment.name}'`
            : undefined
        }
        confirmLabel={
          pendingAction?.type === "delete"
            ? "Delete"
            : pendingAction?.type === "activate"
              ? "Activate"
              : "Deactivate"
        }
        destructive={pendingAction?.type === "delete"}
        pending={isMutating}
        onConfirm={confirmPendingAction}
        onClose={() => setPendingAction(null)}
      />
    </div>
  );
}