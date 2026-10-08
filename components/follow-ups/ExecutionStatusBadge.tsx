"use client";

import {
  CheckCircle2,
  CircleSlash,
  Clock,
  LoaderCircle,
  RotateCw,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { FollowUpExecutionStatus } from "@/types/follow-up";

type StatusConfig = {
  label: string;
  tone: BadgeTone;
  icon: LucideIcon;
  /** Spin the icon while the execution is in flight. */
  spin?: boolean;
};

/**
 * Vietnamese labels required by FE-08:
 *   PENDING = CHỜ · RUNNING/PROCESSING = ĐANG CHẠY · SUCCESS/COMPLETED = HOÀN THÀNH · FAILED = THẤT BẠI
 * RETRYING and SKIPPED come from the backend enum and get their own labels.
 */
const STATUS_CONFIG: Record<FollowUpExecutionStatus, StatusConfig> = {
  PENDING: { label: "CHỜ", tone: "neutral", icon: Clock },
  RUNNING: { label: "ĐANG CHẠY", tone: "info", icon: LoaderCircle, spin: true },
  SUCCESS: { label: "HOÀN THÀNH", tone: "success", icon: CheckCircle2 },
  FAILED: { label: "THẤT BẠI", tone: "danger", icon: XCircle },
  RETRYING: { label: "CHỜ RETRY", tone: "warning", icon: RotateCw },
  SKIPPED: { label: "BỎ QUA", tone: "neutral", icon: CircleSlash },
};

/** Aliases accepted from the API for forward compatibility. */
export function resolveExecutionStatus(
  status?: FollowUpExecutionStatus | "PROCESSING" | "COMPLETED" | string,
): FollowUpExecutionStatus {
  switch (status) {
    case "PROCESSING":
      return "RUNNING";
    case "COMPLETED":
      return "SUCCESS";
    default:
      return (status ?? "PENDING") as FollowUpExecutionStatus;
  }
}

export function isRetryableStatus(status: FollowUpExecutionStatus): boolean {
  return status === "FAILED" || status === "RETRYING";
}

export function ExecutionStatusBadge({
  status,
  className,
}: {
  status?: FollowUpExecutionStatus | "PROCESSING" | "COMPLETED" | string;
  className?: string;
}) {
  const resolved = resolveExecutionStatus(status);
  const config = STATUS_CONFIG[resolved] ?? {
    label: resolved,
    tone: "neutral" as BadgeTone,
    icon: Clock,
  };
  const Icon = config.icon;

  return (
    <Badge tone={config.tone} className={className}>
      <Icon className={config.spin ? "animate-spin" : undefined} />
      {config.label}
    </Badge>
  );
}

export { STATUS_CONFIG };