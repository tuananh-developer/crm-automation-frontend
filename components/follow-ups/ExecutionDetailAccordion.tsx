"use client";

import { ChevronDown, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  FollowUpExecution,
  FollowUpRequestPayload,
} from "@/types/follow-up";

function readString(
  payload: Record<string, unknown> | null,
  key: string,
): string | null {
  const value = payload?.[key];
  return typeof value === "string" ? value : null;
}

export function getStepLabel(execution: FollowUpExecution): string {
  const payload = execution.requestPayload as FollowUpRequestPayload | null;
  const order = payload?.stepOrder;

  return typeof order === "number" ? `Step ${order}` : "Step";
}

export function getChannel(execution: FollowUpExecution): string {
  const payload = execution.requestPayload as FollowUpRequestPayload | null;
  return payload?.channel ?? "—";
}

function JsonBlock({
  title,
  value,
  tone = "default",
}: {
  title: string;
  value: unknown;
  tone?: "default" | "danger";
}) {
  if (value === null || value === undefined) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </p>
      <pre
        className={cn(
          "max-h-56 overflow-auto rounded-xl border p-3 text-xs leading-relaxed",
          tone === "danger"
            ? "border-red-200 bg-red-50 text-red-800"
            : "border-[#e2e8e4] bg-[#f6f8f7] text-[#17221c]",
        )}
      >
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

type ExecutionDetailAccordionProps = {
  execution: FollowUpExecution;
  open: boolean;
  onToggle: () => void;
};

/**
 * Inline detail view (accordion) for a single execution: message sent to n8n,
 * provider response and the stored error.
 */
export function ExecutionDetailAccordion({
  execution,
  open,
  onToggle,
}: ExecutionDetailAccordionProps) {
  const payload = execution.requestPayload as FollowUpRequestPayload | null;
  const message = readString(
    execution.requestPayload as Record<string, unknown> | null,
    "message",
  );
  const recipient = readString(
    execution.requestPayload as Record<string, unknown> | null,
    "recipient",
  );

  return (
    <div className="rounded-xl border border-[#e2e8e4] bg-white">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-[#17221c] transition hover:bg-[#f6f8f7]"
      >
        <span>Xem chi tiết execution</span>
        <ChevronDown
          className={cn(
            "size-4 text-gray-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div className="space-y-4 border-t border-[#edf0ee] px-4 py-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Execution ID
              </dt>
              <dd className="mt-1 break-all text-xs text-[#17221c]">
                {execution.id}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Step ID
              </dt>
              <dd className="mt-1 break-all text-xs text-[#17221c]">
                {execution.stepId}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Enrollment ID
              </dt>
              <dd className="mt-1 break-all text-xs text-[#17221c]">
                {execution.enrollmentId}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Recipient
              </dt>
              <dd className="mt-1 break-all text-xs text-[#17221c]">
                {recipient ?? "—"}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Subject
              </dt>
              <dd className="mt-1 text-xs text-[#17221c]">
                {payload?.subject ?? "—"}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Provider message ID
              </dt>
              <dd className="mt-1 break-all text-xs text-[#17221c]">
                {execution.providerMessageId ?? "—"}
              </dd>
            </div>
          </dl>

          {message ? (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Message
              </p>
              <p className="rounded-xl border border-[#e2e8e4] bg-[#f6f8f7] p-3 text-xs leading-relaxed whitespace-pre-line text-[#17221c]">
                {message}
              </p>
            </div>
          ) : null}

          <JsonBlock title="Request payload" value={execution.requestPayload} />
          <JsonBlock title="Response payload" value={execution.responsePayload} />

          {execution.errorMessage ? (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                Error message
              </p>
              <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-relaxed text-red-800">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                {execution.errorMessage}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}