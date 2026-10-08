"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { getApiErrorMessage } from "@/services/api-client";
import {
  activateSegment,
  deactivateSegment,
  deleteSegment,
  evaluateCustomer,
  getSegment,
  getSegmentCustomers,
} from "@/services/segment.service";
import { ConfirmDialog } from "@/components/segments/ConfirmDialog";
import { CustomerSegmentTable } from "@/components/segments/CustomerSegmentTable";
import { EvaluateCustomerDialog } from "@/components/segments/EvaluateCustomerDialog";
import { EvaluateResultList } from "@/components/segments/EvaluateResult";
import { SegmentDetail } from "@/components/segments/SegmentDetail";
import {
  ErrorState,
  LoadingState,
  Notice,
} from "@/components/segments/States";
import type {
  SegmentAssignmentType,
  SegmentEvaluationResult,
} from "@/types/segment";

export default function SegmentDetailPage() {
  const params = useParams<{ id: string }>();
  const segmentId = params.id;
  const router = useRouter();
  const queryClient = useQueryClient();

  const [search, setSearch] = React.useState("");
  const [assignmentFilter, setAssignmentFilter] = React.useState<
    "ALL" | SegmentAssignmentType
  >("ALL");
  const [page, setPage] = React.useState(1);
  const [notice, setNotice] = React.useState<{
    tone: "success" | "danger";
    message: string;
  } | null>(null);
  const [confirmAction, setConfirmAction] = React.useState<
    "activate" | "deactivate" | "delete" | null
  >(null);
  const [isEvaluateOpen, setEvaluateOpen] = React.useState(false);
  const [evaluationResults, setEvaluationResults] = React.useState<
    SegmentEvaluationResult[]
  >([]);

  const segmentQuery = useQuery({
    queryKey: ["segments", segmentId],
    queryFn: () => getSegment(segmentId),
    enabled: Boolean(segmentId),
  });

  // `GET /segments/:id/customers` only whitelists page/limit/search/isActive,
  // so the assignment type filter is applied on the returned rows.
  const customerParams = React.useMemo(
    () => ({
      page,
      limit: 10,
      search: search.trim() || undefined,
    }),
    [page, search],
  );

  const customersQuery = useQuery({
    queryKey: ["segments", segmentId, "customers", customerParams],
    queryFn: () => getSegmentCustomers(segmentId, customerParams),
    enabled: Boolean(segmentId),
  });

  const invalidateSegmentQueries = () =>
    queryClient.invalidateQueries({ queryKey: ["segments"] });

  const toggleMutation = useMutation({
    mutationFn: (nextState: boolean) =>
      nextState ? activateSegment(segmentId) : deactivateSegment(segmentId),
    onSuccess: async (segment) => {
      await invalidateSegmentQueries();
      setNotice({
        tone: "success",
        message: `Segment '${segment.name}' is now ${
          segment.isActive ? "ACTIVE" : "INACTIVE"
        }.`,
      });
      setConfirmAction(null);
    },
    onError: (error) => {
      setNotice({ tone: "danger", message: getApiErrorMessage(error) });
      setConfirmAction(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteSegment(segmentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["segments"] });
      router.push("/segments");
      router.refresh();
    },
    onError: (error) => {
      setNotice({ tone: "danger", message: getApiErrorMessage(error) });
      setConfirmAction(null);
    },
  });

  const evaluateMutation = useMutation({
    mutationFn: ({
      customerIds,
      assignmentType,
    }: {
      customerIds: string[];
      assignmentType: SegmentAssignmentType;
    }) =>
      Promise.all(
        customerIds.map((customerId) =>
          evaluateCustomer(segmentId, { customerId, assignmentType }),
        ),
      ),
    onSuccess: async (results) => {
      setEvaluationResults(results);
      await invalidateSegmentQueries();
      setNotice({
        tone: "success",
        message: `Evaluated ${results.length} customer(s) against this segment.`,
      });
    },
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

  const segment = segmentQuery.data;

  if (!segment) {
    return (
      <EmptySegment
        onBack={() => router.push("/segments")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm text-gray-500">
        <Link href="/segments" className="font-medium hover:text-[#173b2b]">
          Segments
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[#17221c]">{segment.name}</span>
      </nav>

      {notice ? <Notice tone={notice.tone}>{notice.message}</Notice> : null}

      <SegmentDetail
        segment={segment}
        customerCount={
          segmentQuery.data?.customerCount ?? customersQuery.data?.meta?.total
        }
        isMutating={toggleMutation.isPending || deleteMutation.isPending}
        onEdit={() => router.push(`/segments/${segmentId}/edit`)}
        onToggle={() =>
          setConfirmAction(segment.isActive ? "deactivate" : "activate")
        }
        onDelete={() => setConfirmAction("delete")}
        onEvaluate={() => setEvaluateOpen(true)}
      />

      {evaluationResults.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">
            Latest evaluation result
          </h3>
          <EvaluateResultList
            results={evaluationResults}
            segmentNames={{ [segment.id]: segment.name }}
          />
        </div>
      ) : null}

      <CustomerSegmentTable
        assignments={customersQuery.data?.data ?? []}
        meta={customersQuery.data?.meta}
        isLoading={customersQuery.isLoading}
        error={
          customersQuery.isError
            ? getApiErrorMessage(customersQuery.error)
            : null
        }
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        assignmentFilter={assignmentFilter}
        onAssignmentFilterChange={(value) => {
          setAssignmentFilter(value);
          setPage(1);
        }}
        page={page}
        onPageChange={setPage}
        onRetry={() => customersQuery.refetch()}
      />

      <ConfirmDialog
        open={confirmAction !== null}
        title={
          confirmAction === "delete"
            ? "Delete segment"
            : confirmAction === "activate"
              ? "Activate segment"
              : "Deactivate segment"
        }
        description={`Segment '${segment.name}'`}
        confirmLabel={
          confirmAction === "delete"
            ? "Delete"
            : confirmAction === "activate"
              ? "Activate"
              : "Deactivate"
        }
        destructive={confirmAction === "delete"}
        pending={toggleMutation.isPending || deleteMutation.isPending}
        onConfirm={() => {
          if (confirmAction === "delete") {
            deleteMutation.mutate();
            return;
          }
          toggleMutation.mutate(confirmAction === "activate");
        }}
        onClose={() => setConfirmAction(null)}
      />

      {isEvaluateOpen ? (
        <EvaluateCustomerDialog
          open
          onClose={() => setEvaluateOpen(false)}
          segments={[segment]}
          customers={customersQuery.data?.data ?? []}
          initialSegmentId={segmentId}
          isEvaluating={evaluateMutation.isPending}
          onEvaluate={async ({ customerIds, assignmentType }) => {
            try {
              return await evaluateMutation.mutateAsync({
                customerIds,
                assignmentType,
              });
            } catch (error) {
              throw new Error(getApiErrorMessage(error));
            }
          }}
        />
      ) : null}
    </div>
  );
}

function EmptySegment({ onBack }: { onBack: () => void }) {
  return (
    <div className="rounded-2xl border border-[#e2e8e4] bg-white px-5 py-14 text-center">
      <p className="font-semibold text-[#17221c]">Segment not found</p>
      <button
        type="button"
        onClick={onBack}
        className="mt-3 text-sm font-semibold text-[#173b2b] underline"
      >
        Back to segments
      </button>
    </div>
  );
}