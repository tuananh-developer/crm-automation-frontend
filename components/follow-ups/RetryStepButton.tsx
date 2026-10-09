"use client";

import { LoaderCircle, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { FollowUpExecution } from "@/types/follow-up";

type RetryStepButtonProps = {
  execution: FollowUpExecution;
  pending: boolean;
  disabled?: boolean;
  onRetry: (execution: FollowUpExecution) => void;
};

/**
 * "Retry Step" — calls the backend with the same enrollmentId + stepId.
 * The button is disabled while its own request is in flight so the user
 * cannot trigger duplicate executions.
 */
export function RetryStepButton({
  execution,
  pending,
  disabled = false,
  onRetry,
}: RetryStepButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled || pending}
      aria-busy={pending}
      aria-label={`Retry step ${execution.stepId}`}
      onClick={() => onRetry(execution)}
    >
      {pending ? (
        <LoaderCircle className="animate-spin" />
      ) : (
        <RotateCw />
      )}
      {pending ? "Đang retry…" : "Retry Step"}
    </Button>
  );
}