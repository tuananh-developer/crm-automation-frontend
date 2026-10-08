"use client";

import * as React from "react";
import { Flame, Sparkles, Snowflake } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScoreLabel } from "@/types/lead";

interface ScoreBadgeProps {
  score?: number | string | null;
  label?: ScoreLabel | string | null;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export function ScoreBadge({
  score,
  label,
  size = "md",
  showIcon = true,
  className,
}: ScoreBadgeProps) {
  const numericScore =
    score !== undefined && score !== null ? Math.round(Number(score)) : null;

  // Determine label if not provided
  let effectiveLabel: ScoreLabel = "COLD";
  if (label === "HOT" || (numericScore !== null && numericScore >= 75)) {
    effectiveLabel = "HOT";
  } else if (
    label === "WARM" ||
    (numericScore !== null && numericScore >= 40)
  ) {
    effectiveLabel = "WARM";
  }

  const configs: Record<
    ScoreLabel,
    {
      bg: string;
      text: string;
      border: string;
      ring: string;
      icon: React.ReactNode;
      labelName: string;
    }
  > = {
    HOT: {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      border: "border-emerald-300",
      ring: "ring-emerald-500/20",
      icon: <Flame className="size-3.5 fill-emerald-500 text-emerald-600" />,
      labelName: "HOT",
    },
    WARM: {
      bg: "bg-amber-100",
      text: "text-amber-700",
      border: "border-amber-300",
      ring: "ring-amber-500/20",
      icon: <Sparkles className="size-3.5 text-amber-600" />,
      labelName: "WARM",
    },
    COLD: {
      bg: "bg-sky-100",
      text: "text-sky-700",
      border: "border-sky-300",
      ring: "ring-sky-500/20",
      icon: <Snowflake className="size-3.5 text-sky-600" />,
      labelName: "COLD",
    },
  };

  const config = configs[effectiveLabel];

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-semibold gap-1",
    md: "px-2.5 py-1 text-xs font-bold gap-1.5",
    lg: "px-3.5 py-1.5 text-sm font-extrabold gap-2",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border shadow-2xs transition-all",
        config.bg,
        config.text,
        config.border,
        sizeClasses[size],
        className,
      )}
    >
      {showIcon && config.icon}
      <span>
        {numericScore !== null ? `${numericScore} · ` : ""}
        {config.labelName}
      </span>
    </span>
  );
}
