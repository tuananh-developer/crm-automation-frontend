export const POLL_INTERVAL_MS = 3000;
export const MAX_POLL_ATTEMPTS = 20; // 60s max automatic polling budget
export const STUCK_THRESHOLD_MS = 60_000; // 60s before processing is considered stuck

export type WorkflowRunStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCESS"
  | "PARTIAL"
  | "FAILED"
  | "CANCELLED";

export type TranscriptProcessingStatus =
  | "PENDING"
  | "RUNNING"
  | "PROCESSING"
  | "COMPLETED"
  | "SUCCESS"
  | "PARTIAL"
  | "FAILED"
  | "CANCELLED";

export function isWorkflowRunActive(status?: string | null): boolean {
  return status === "PENDING" || status === "RUNNING";
}

export function isWorkflowRunFailure(status?: string | null): boolean {
  return status === "FAILED" || status === "CANCELLED";
}

export function isTranscriptProcessingActive(status?: string | null): boolean {
  return (
    status === "PENDING" ||
    status === "RUNNING" ||
    status === "PROCESSING"
  );
}

export function isTranscriptProcessingDone(status?: string | null): boolean {
  return (
    status === "COMPLETED" ||
    status === "SUCCESS" ||
    status === "PARTIAL"
  );
}

export function isTranscriptProcessingFailed(status?: string | null): boolean {
  return status === "FAILED" || status === "CANCELLED";
}

export function evaluatePollStep(params: {
  isQueryError: boolean;
  isActive: boolean;
  attemptsRef: { current: number };
  maxAttempts?: number;
  intervalMs?: number;
  onTimeout?: () => void;
}): number | false {
  const {
    isQueryError,
    isActive,
    attemptsRef,
    maxAttempts = MAX_POLL_ATTEMPTS,
    intervalMs = POLL_INTERVAL_MS,
    onTimeout,
  } = params;

  if (isQueryError) {
    return false;
  }

  if (!isActive) {
    attemptsRef.current = 0;
    return false;
  }

  if (attemptsRef.current >= maxAttempts) {
    onTimeout?.();
    return false;
  }

  attemptsRef.current += 1;
  return intervalMs;
}

export interface TranscriptStuckInput {
  processingStatus?: string | null;
  createdAt?: string | null;
}

export function checkTranscriptStuck(
  transcript: TranscriptStuckInput | null | undefined,
  pollingTimedOut: boolean,
  lastTranscriptId: string | null,
  nowMs: number = Date.now(),
): boolean {
  if (lastTranscriptId && pollingTimedOut && !transcript) return true;
  if (!transcript) return false;
  if (!isTranscriptProcessingActive(transcript.processingStatus)) {
    return false;
  }
  if (pollingTimedOut) return true;
  if (!transcript.createdAt) return false;
  const timestamp = new Date(transcript.createdAt).getTime();
  if (Number.isNaN(timestamp)) return pollingTimedOut;
  return nowMs - timestamp > STUCK_THRESHOLD_MS;
}
