import * as React from "react";
import { CheckCircle2, PauseCircle, Ban, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EnrollmentStatus } from "@/types/follow-up";

interface EnrollmentStatusBadgeProps {
  status: EnrollmentStatus | string;
  className?: string;
  showIcon?: boolean;
}

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: React.ElementType }
> = {
  ACTIVE: {
    label: "Active Cadence",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: PlayCircle,
  },
  PAUSED: {
    label: "Paused",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: PauseCircle,
  },
  COMPLETED: {
    label: "Completed",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    icon: Ban,
  },
};

export function EnrollmentStatusBadge({
  status,
  className,
  showIcon = true,
}: EnrollmentStatusBadgeProps) {
  const normalized = (status || "ACTIVE").toUpperCase();
  const config = statusConfig[normalized] ?? {
    label: normalized,
    bg: "bg-gray-50",
    text: "text-gray-700",
    border: "border-gray-200",
    icon: PlayCircle,
  };

  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-colors",
        config.bg,
        config.text,
        config.border,
        className,
      )}
    >
      {showIcon && <Icon className="size-3.5" />}
      <span>{config.label}</span>
      {normalized === "ACTIVE" && (
        <span className="relative flex size-1.5 ml-0.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500"></span>
        </span>
      )}
    </span>
  );
}
