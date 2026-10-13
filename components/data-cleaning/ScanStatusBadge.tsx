import * as React from "react";
import { AlertCircle, CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";

interface ScanStatusBadgeProps {
  status: string;
}

export function ScanStatusBadge({ status }: ScanStatusBadgeProps) {
  switch (status) {
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
          <Clock className="size-3 text-amber-600" />
          Pending Ingestion
        </span>
      );
    case "RUNNING":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
          <Loader2 className="size-3 text-blue-600 animate-spin" />
          Scanning Pipeline
        </span>
      );
    case "SUCCESS":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="size-3 text-emerald-600" />
          Scan Completed
        </span>
      );
    case "PARTIAL":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-semibold text-yellow-800 border border-yellow-200">
          <AlertCircle className="size-3 text-yellow-600" />
          Partially Completed
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
          <XCircle className="size-3 text-rose-600" />
          Scan Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700 border border-gray-200">
          {status}
        </span>
      );
  }
}
