"use client";

import { Loader2, TriangleAlert, Inbox } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function LoadingState({
  label = "Loading data…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-3 px-5 py-14 text-sm text-gray-500",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-5 animate-spin text-[#173b2b]" />
      {label}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 px-5 py-14 text-center",
        className,
      )}
    >
      <div className="rounded-xl bg-[#edf4ef] p-3 text-[#173b2b]">
        <Inbox className="size-5" />
      </div>

      <div>
        <p className="font-semibold text-[#17221c]">{title}</p>
        {description ? (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        ) : null}
      </div>

      {action}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 px-5 py-14 text-center",
        className,
      )}
      role="alert"
    >
      <div className="rounded-xl bg-red-50 p-3 text-red-600">
        <TriangleAlert className="size-5" />
      </div>

      <div>
        <p className="font-semibold text-[#17221c]">Something went wrong</p>
        <p className="mt-1 max-w-md text-sm text-gray-500">{message}</p>
      </div>

      {onRetry ? (
        <Button type="button" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

type NoticeTone = "success" | "danger" | "info";

const noticeStyles: Record<NoticeTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  danger: "border-red-200 bg-red-50 text-red-700",
  info: "border-[#d7e4db] bg-[#f2f7f3] text-[#173b2b]",
};

export function Notice({
  tone,
  children,
  className,
}: {
  tone: NoticeTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "rounded-xl border px-4 py-3 text-sm font-medium",
        noticeStyles[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}