"use client";

import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Play, Users } from "lucide-react";

import { getApiErrorMessage } from "@/services/api-client";
import {
  evaluateCustomer,
  evaluateSegmentCustomers,
  getSegment,
  getSegmentCustomers,
  getSegments,
} from "@/services/segment.service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  EvaluateOutcomeMessage,
  EvaluateResultList,
  EvaluationStatusBadge,
} from "@/components/segments/EvaluateResult";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Notice,
} from "@/components/segments/States";
import type {
  EvaluationStatus,
  SegmentAssignmentType,
  SegmentEvaluationResult,
} from "@/types/segment";

const assignmentTypes: SegmentAssignmentType[] = ["RULE", "AI"];

export default function EvaluateSegmentPage() {
  const [segmentId, setSegmentId] = React.useState("");
  const [assignmentType, setAssignmentType] =
    React.useState<SegmentAssignmentType>("RULE");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [status, setStatus] = React.useState<EvaluationStatus>("PENDING");
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [results, setResults] = React.useState<SegmentEvaluationResult[]>([]);

  const segmentsQuery = useQuery({
    queryKey: ["segments", { page: 1, limit: 100 }],
    queryFn: () => getSegments({ page: 1, limit: 100 }),
  });

  const segmentQuery = useQuery({
    queryKey: ["segments", segmentId],
    queryFn: () => getSegment(segmentId),
    enabled: Boolean(segmentId),
  });

  const customersQuery = useQuery({
    queryKey: ["segments", segmentId, "customers", { limit: 100 }],
    queryFn: () => getSegmentCustomers(segmentId, { limit: 100 }),
    enabled: Boolean(segmentId),
  });

  const segmentNames = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const segment of segmentsQuery.data?.data ?? []) {
      map[segment.id] = segment.name;
    }
    return map;
  }, [segmentsQuery.data]);

  const bulkMutation = useMutation({
    mutationFn: () =>
      evaluateSegmentCustomers(segmentId, { assignmentType }),
    onSuccess: (response) => {
      setStatus("COMPLETED");
      setMessage(
        response.message ??
          `Bulk evaluation finished: ${response.processed}/${response.total} processed, ${response.matched} matched.`,
      );
    },
    onError: (bulkError) => {
      setStatus("FAILED");
      setMessage(getApiErrorMessage(bulkError));
    },
  });

  const singleMutation = useMutation({
    mutationFn: (customerId: string) =>
      evaluateCustomer(segmentId, { customerId, assignmentType }),
  });

  const runEvaluation = async () => {
    setError(null);
    setMessage(null);
    setResults([]);

    if (!segmentId) {
      setError("Please choose a segment.");
      return;
    }

    if (selectedIds.length === 0) {
      setError("Please choose at least one customer.");
      return;
    }

    setStatus("PROCESSING");

    try {
      const response = await Promise.all(
        selectedIds.map((customerId) => singleMutation.mutateAsync(customerId)),
      );

      setResults(response);
      setStatus("COMPLETED");
      setMessage(`Evaluated ${response.length} customer(s).`);
    } catch (evaluationError) {
      setStatus("FAILED");
      setMessage(getApiErrorMessage(evaluationError));
    }
  };

  const runBulkEvaluation = () => {
    setError(null);
    setMessage(null);
    setStatus("PROCESSING");
    bulkMutation.mutate();
  };

  const segments = segmentsQuery.data?.data ?? [];
  const customers = customersQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-bold">Segment evaluation</h2>
        <p className="text-sm text-gray-500">
          Evaluate one or many customers against a segment using RULE or AI.
        </p>
      </div>

      {error ? <Notice tone="danger">{error}</Notice> : null}

      <Card>
        <CardHeader>
          <CardTitle>Evaluation setup</CardTitle>
          <CardDescription>
            The backend reads the customer, company, score and behavioural data,
            then stores the assignment in <code>customer_segments</code>.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {segmentsQuery.isLoading ? (
            <LoadingState label="Loading segments…" />
          ) : segmentsQuery.isError ? (
            <ErrorState
              message={getApiErrorMessage(segmentsQuery.error)}
              onRetry={() => segmentsQuery.refetch()}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="evaluate-page-segment">Segment</Label>
                <Select
                  id="evaluate-page-segment"
                  value={segmentId}
                  onChange={(event) => {
                    setSegmentId(event.target.value);
                    setSelectedIds([]);
                    setResults([]);
                  }}
                >
                  <option value="">Select segment…</option>
                  {segments.map((segment) => (
                    <option key={segment.id} value={segment.id}>
                      {segment.name}
                      {segment.isActive ? "" : " (INACTIVE)"}
                    </option>
                  ))}
                </Select>
                {segmentQuery.data ? (
                  <p className="text-xs text-gray-500">
                    Criteria: {segmentQuery.data.criteria?.conditions.length ?? 0}{" "}
                    condition(s)
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="evaluate-page-type">Assignment type</Label>
                <Select
                  id="evaluate-page-type"
                  value={assignmentType}
                  onChange={(event) =>
                    setAssignmentType(
                      event.target.value as SegmentAssignmentType,
                    )
                  }
                >
                  {assignmentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-semibold text-[#17221c]">
              Customers{segmentId ? "" : " (choose a segment first)"}
            </p>

            {!segmentId ? (
              <p className="rounded-xl border border-dashed border-[#d7e4db] bg-[#f6f8f7] px-4 py-6 text-center text-sm text-gray-500">
                Select a segment to load its customers.
              </p>
            ) : customersQuery.isLoading ? (
              <LoadingState label="Loading customers…" />
            ) : customersQuery.isError ? (
              <ErrorState
                message={getApiErrorMessage(customersQuery.error)}
                onRetry={() => customersQuery.refetch()}
              />
            ) : customers.length === 0 ? (
              <EmptyState
                title="No customer to evaluate"
                description="This segment has no assignment yet, so no customer can be evaluated. Use Evaluate All Customers to let the backend scan all customers."
              />
            ) : (
              <ul className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-[#e2e8e4] p-2">
                {customers.map((item) => (
                  <li key={item.customerId}>
                    <label className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-[#f6f8f7]">
                      <input
                        type="checkbox"
                        className="size-4 accent-[#173b2b]"
                        checked={selectedIds.includes(item.customerId)}
                        onChange={(event) =>
                          setSelectedIds((previous) =>
                            event.target.checked
                              ? [...previous, item.customerId]
                              : previous.filter(
                                  (id) => id !== item.customerId,
                                ),
                          )
                        }
                      />
                      <span className="flex-1 truncate">
                        {item.customer?.name ?? item.customerId}
                      </span>
                      <span className="truncate text-xs text-gray-400">
                        {item.customer?.email ?? ""}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!segmentId || bulkMutation.isPending}
              onClick={runBulkEvaluation}
            >
              <Users />
              {bulkMutation.isPending
                ? "Processing…"
                : "Evaluate All Customers"}
            </Button>

            <Button
              type="button"
              disabled={
                !segmentId ||
                selectedIds.length === 0 ||
                singleMutation.isPending
              }
              onClick={runEvaluation}
            >
              <Play />
              {singleMutation.isPending ? "Evaluating…" : "Evaluate"}
            </Button>
          </div>

          <div className="space-y-2 border-t border-[#edf0ee] pt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#17221c]">
                Status
              </span>
              <EvaluationStatusBadge status={status} />
            </div>

            <EvaluateOutcomeMessage
              status={status}
              message={message ?? undefined}
            />

            {results.length > 0 ? (
              <EvaluateResultList results={results} segmentNames={segmentNames} />
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}