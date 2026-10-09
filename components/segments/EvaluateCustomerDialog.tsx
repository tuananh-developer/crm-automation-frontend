"use client";

import * as React from "react";
import { Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Modal } from "./Modal";
import {
  EvaluateOutcomeMessage,
  EvaluateResultList,
  EvaluationStatusBadge,
} from "./EvaluateResult";
import type {
  CustomerSegmentAssignment,
  EvaluationStatus,
  Segment,
  SegmentAssignmentType,
  SegmentEvaluationResult,
} from "@/types/segment";

type EvaluateCustomerDialogProps = {
  open: boolean;
  onClose: () => void;
  segments: Segment[];
  customers: CustomerSegmentAssignment[];
  initialSegmentId?: string;
  isEvaluating: boolean;
  onEvaluate: (input: {
    segmentId: string;
    customerIds: string[];
    assignmentType: SegmentAssignmentType;
  }) => Promise<SegmentEvaluationResult[]>;
};

const assignmentTypes: SegmentAssignmentType[] = ["RULE", "AI"];

/**
 * "Evaluate Customer" dialog: pick a segment, one or many customers and the
 * assignment type, then send the evaluation request to the backend.
 */
export function EvaluateCustomerDialog({
  open,
  onClose,
  segments,
  customers,
  initialSegmentId,
  isEvaluating,
  onEvaluate,
}: EvaluateCustomerDialogProps) {
  const [segmentId, setSegmentId] = React.useState(
    initialSegmentId ?? "",
  );
  const [customerId, setCustomerId] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [assignmentType, setAssignmentType] =
    React.useState<SegmentAssignmentType>("RULE");
  const [status, setStatus] = React.useState<EvaluationStatus>("PENDING");
  const [error, setError] = React.useState<string | null>(null);
  const [results, setResults] = React.useState<SegmentEvaluationResult[]>([]);

  const segmentCustomers = React.useMemo(
    () =>
      customers.filter(
        (item) => !segmentId || item.segmentId === segmentId,
      ),
    [customers, segmentId],
  );

  const handleEvaluate = async () => {
    setError(null);

    if (!segmentId) {
      setError("Please choose a segment.");
      return;
    }

    const targetIds =
      selectedIds.length > 0
        ? selectedIds
        : customerId.trim()
          ? [customerId.trim()]
          : [];

    if (targetIds.length === 0) {
      setError("Please choose at least one customer.");
      return;
    }

    setStatus("PROCESSING");

    try {
      const response = await onEvaluate({
        segmentId,
        customerIds: targetIds,
        assignmentType,
      });

      setResults(response);
      setStatus("COMPLETED");
      setSelectedIds([]);
    } catch (evaluateError) {
      setStatus("FAILED");
      setError(
        evaluateError instanceof Error
          ? evaluateError.message
          : "Evaluation failed.",
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Evaluate Customer"
      description="Ask the backend to evaluate customers against a segment using RULE or AI."
      className="max-w-2xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            onClick={handleEvaluate}
            disabled={isEvaluating || status === "PROCESSING"}
          >
            <Play />
            {isEvaluating || status === "PROCESSING"
              ? "Evaluating…"
              : "Evaluate"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="evaluate-segment">Segment</Label>
            <Select
              id="evaluate-segment"
              value={segmentId}
              onChange={(event) => {
                setSegmentId(event.target.value);
                setSelectedIds([]);
              }}
            >
              <option value="">Select segment…</option>
              {segments.map((segment) => (
                <option key={segment.id} value={segment.id}>
                  {segment.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="evaluate-assignment-type">Assignment type</Label>
            <Select
              id="evaluate-assignment-type"
              value={assignmentType}
              onChange={(event) =>
                setAssignmentType(event.target.value as SegmentAssignmentType)
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

        <div className="space-y-2">
          <Label htmlFor="evaluate-customer">Customer</Label>
          <Select
            id="evaluate-customer"
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
          >
            <option value="">Select customer…</option>
            {segmentCustomers.map((item) => (
              <option key={item.customerId} value={item.customerId}>
                {item.customer?.name ?? item.customerId}
                {item.customer?.email ? ` · ${item.customer.email}` : ""}
              </option>
            ))}
          </Select>
          <p className="text-xs text-gray-500">
            No customer loaded yet? Paste the customer UUID below.
          </p>
          <Input
            placeholder="Customer UUID"
            value={customerId}
            aria-label="Customer UUID"
            onChange={(event) => setCustomerId(event.target.value)}
          />
        </div>

        {segmentCustomers.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[#17221c]">
              Or select multiple customers
            </p>

            <ul className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-[#e2e8e4] p-2">
              {segmentCustomers.map((item) => (
                <li key={item.customerId}>
                  <label className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-[#f6f8f7]">
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
                    <span className="truncate">
                      {item.customer?.name ?? item.customerId}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#17221c]">
              Status
            </span>
            <EvaluationStatusBadge status={status} />
          </div>

          <EvaluateOutcomeMessage
            status={status}
            message={error ?? undefined}
          />

          {results.length > 0 ? <EvaluateResultList results={results} /> : null}
        </div>
      </div>
    </Modal>
  );
}