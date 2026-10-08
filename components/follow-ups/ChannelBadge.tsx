import * as React from "react";
import { Mail, MessageSquare, Phone, CheckSquare, Globe, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FollowUpChannel } from "@/types/follow-up";

interface ChannelBadgeProps {
  channel: FollowUpChannel | string;
  className?: string;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export const channelConfig: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string; border: string }
> = {
  EMAIL: {
    label: "Email",
    icon: Mail,
    color: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200",
  },
  SMS: {
    label: "SMS",
    icon: MessageSquare,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  MESSAGE: {
    label: "SMS / Message",
    icon: MessageSquare,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  CALL: {
    label: "Phone Call",
    icon: Phone,
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  TASK: {
    label: "Task / Todo",
    icon: CheckSquare,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  WEBHOOK: {
    label: "Webhook",
    icon: Globe,
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
  },
};

export function ChannelBadge({
  channel,
  className,
  size = "md",
  showLabel = true,
}: ChannelBadgeProps) {
  const normalized = (channel || "EMAIL").toUpperCase();
  const config = channelConfig[normalized] ?? {
    label: normalized,
    icon: Send,
    color: "text-gray-700",
    bg: "bg-gray-50",
    border: "border-gray-200",
  };

  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border font-medium",
        config.bg,
        config.color,
        config.border,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        className,
      )}
    >
      <Icon className={size === "sm" ? "size-3" : "size-3.5"} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

export function ChannelIcon({
  channel,
  className,
}: {
  channel: FollowUpChannel | string;
  className?: string;
}) {
  const normalized = (channel || "EMAIL").toUpperCase();
  const config = channelConfig[normalized] ?? {
    label: normalized,
    icon: Send,
    color: "text-gray-700",
  };
  const Icon = config.icon;
  return <Icon className={cn("size-4", config.color, className)} />;
}
