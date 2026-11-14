import type {
  ConversationTranscriptItem,
  TranscriptProcessingStatus,
} from '@/types/conversation';

export const POLL_INTERVAL_MS = 3000;
export const MAX_POLL_ATTEMPTS = 20;
export const STUCK_THRESHOLD_MS = 60_000;

const TRANSCRIPT_STORAGE_PREFIX = 'crm:customer-conversations:last-transcript:';

const ACTIVE_WORKFLOW_RUN_STATUSES = new Set(['PENDING', 'RUNNING']);
const FAILED_WORKFLOW_RUN_STATUSES = new Set(['FAILED', 'CANCELLED']);

const ACTIVE_TRANSCRIPT_STATUSES = new Set(['PENDING', 'RUNNING', 'PROCESSING']);
const DONE_TRANSCRIPT_STATUSES = new Set(['COMPLETED', 'SUCCESS', 'PARTIAL']);
const FAILED_TRANSCRIPT_STATUSES = new Set(['FAILED', 'CANCELLED']);

export interface TranscriptStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface EvaluatePollingInput {
  queryStatus?: string;
  workflowStatus?: string | null;
  isActive: (status?: string | null) => boolean;
  pollAttempts: number;
  maxAttempts?: number;
  intervalMs?: number;
}

export interface EvaluatePollingResult {
  nextInterval: number | false;
  nextAttempts: number;
  timedOut: boolean;
}

/** Normalizes any raw backend/frontend workflow status string for safe comparison. */
export function normalizeWorkflowStatus(status?: string | null): string {
  return typeof status === 'string' ? status.trim().toUpperCase() : '';
}

/** Returns true while a Customer 360 WorkflowRun is still active (`PENDING` or `RUNNING`). */
export function isWorkflowRunActive(status?: string | null): boolean {
  return ACTIVE_WORKFLOW_RUN_STATUSES.has(normalizeWorkflowStatus(status));
}

/** Returns true when a Customer 360 WorkflowRun ended in failure (`FAILED` or `CANCELLED`). */
export function isWorkflowRunFailed(status?: string | null): boolean {
  return FAILED_WORKFLOW_RUN_STATUSES.has(normalizeWorkflowStatus(status));
}

/** Returns true while transcript processing is still active (`PENDING`, `RUNNING`, or `PROCESSING`). */
export function isTranscriptProcessingActive(status?: string | null): boolean {
  return ACTIVE_TRANSCRIPT_STATUSES.has(normalizeWorkflowStatus(status));
}

/** Returns true when transcript processing completed (`COMPLETED`, `SUCCESS`, or `PARTIAL`). */
export function isTranscriptProcessingDone(status?: string | null): boolean {
  return DONE_TRANSCRIPT_STATUSES.has(normalizeWorkflowStatus(status));
}

/** Returns true when transcript processing failed (`FAILED` or `CANCELLED`). */
export function isTranscriptProcessingFailed(status?: string | null): boolean {
  return FAILED_TRANSCRIPT_STATUSES.has(normalizeWorkflowStatus(status));
}

/** Maps a transcript processing status (and optional stuck flag) to a Badge tone. */
export function getTranscriptStatusBadgeTone(
  status?: TranscriptProcessingStatus | string | null,
  isStuck = false,
): 'success' | 'warning' | 'info' | 'danger' {
  const normalized = normalizeWorkflowStatus(status);
  if (normalized === 'COMPLETED' || normalized === 'SUCCESS') {
    return 'success';
  }
  if (normalized === 'PARTIAL') {
    return 'warning';
  }
  if (ACTIVE_TRANSCRIPT_STATUSES.has(normalized)) {
    return isStuck ? 'warning' : 'info';
  }
  return 'danger';
}

/** Computes the next React Query `refetchInterval`, updated attempt count, and timeout flag. */
export function evaluatePollingInterval({
  queryStatus,
  workflowStatus,
  isActive,
  pollAttempts,
  maxAttempts = MAX_POLL_ATTEMPTS,
  intervalMs = POLL_INTERVAL_MS,
}: EvaluatePollingInput): EvaluatePollingResult {
  if (queryStatus === 'error' || !isActive(workflowStatus)) {
    return { nextInterval: false, nextAttempts: 0, timedOut: false };
  }

  if (pollAttempts >= maxAttempts) {
    return { nextInterval: false, nextAttempts: pollAttempts, timedOut: true };
  }

  return {
    nextInterval: intervalMs,
    nextAttempts: pollAttempts + 1,
    timedOut: false,
  };
}

/** Determines whether transcript summarization has exceeded the bounded polling/time threshold. */
export function checkTranscriptStuck(
  transcript: ConversationTranscriptItem | null | undefined,
  pollingTimedOut: boolean,
  lastTranscriptId: string | null,
  nowMs = Date.now(),
): boolean {
  if (lastTranscriptId && pollingTimedOut && !transcript) {
    return true;
  }
  if (!transcript || !isTranscriptProcessingActive(transcript.processingStatus)) {
    return false;
  }
  if (pollingTimedOut) {
    return true;
  }
  if (!transcript.createdAt) {
    return false;
  }
  const timestamp = new Date(transcript.createdAt).getTime();
  if (Number.isNaN(timestamp)) {
    return pollingTimedOut;
  }
  return nowMs - timestamp > STUCK_THRESHOLD_MS;
}

/** Returns the browser/session storage key used to remember a customer's latest transcript ID. */
export function getTranscriptStorageKey(customerId: string): string {
  return `${TRANSCRIPT_STORAGE_PREFIX}${customerId}`;
}

function getBrowserStorages(): TranscriptStorageLike[] {
  const win = (globalThis as { window?: Window }).window;
  if (!win) return [];
  const candidates: TranscriptStorageLike[] = [];
  for (const prop of ['localStorage', 'sessionStorage'] as const) {
    try {
      const candidate = win[prop];
      if (candidate) candidates.push(candidate);
    } catch {
      // Ignore storage security restrictions (e.g. private browsing / sandboxed iframes).
    }
  }
  return candidates;
}

function getSearchTranscriptId(search?: string): string | null {
  const rawSearch =
    search ?? (globalThis as { window?: Window }).window?.location?.search ?? '';
  if (!rawSearch) return null;
  try {
    const value = new URLSearchParams(rawSearch).get('transcriptId')?.trim();
    return value || null;
  } catch {
    return null;
  }
}

/** Restores the persisted `lastTranscriptId` for a customer across tab remounts and page reloads. */
export function getPersistedTranscriptId(
  customerId: string,
  options?: { storage?: TranscriptStorageLike | null; search?: string },
): string | null {
  if (!customerId) return null;

  const searchTranscriptId = getSearchTranscriptId(options?.search);
  if (searchTranscriptId) {
    return searchTranscriptId;
  }

  const key = getTranscriptStorageKey(customerId);
  const storages =
    options?.storage !== undefined
      ? options.storage
        ? [options.storage]
        : []
      : getBrowserStorages();

  for (const storage of storages) {
    try {
      const value = storage.getItem(key)?.trim();
      if (value) return value;
    } catch {
      // Ignore storage access errors and try fallback storage.
    }
  }

  return null;
}

/** Persists or clears a customer's `lastTranscriptId` in client storage so reloads/tab switches keep it. */
export function setPersistedTranscriptId(
  customerId: string,
  transcriptId: string | null,
  storage?: TranscriptStorageLike | null,
): void {
  if (!customerId) return;

  const key = getTranscriptStorageKey(customerId);
  const trimmed = transcriptId?.trim() || null;
  const storages =
    storage !== undefined ? (storage ? [storage] : []) : getBrowserStorages();

  for (const target of storages) {
    try {
      if (trimmed) {
        target.setItem(key, trimmed);
      } else {
        target.removeItem(key);
      }
    } catch {
      // Ignore quota or security errors when persisting client convenience state.
    }
  }
}
