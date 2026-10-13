"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Lock,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DataCleaningFinding } from "@/types/data-cleaning";

interface ApplyConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedFindings: DataCleaningFinding[];
  isApplying: boolean;
}

export function ApplyConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  selectedFindings,
  isApplying,
}: ApplyConfirmationModalProps) {
  if (!isOpen) return null;

  const totalCount = selectedFindings.length;
  const safeCount = selectedFindings.filter((f) => f.safeToApply).length;
  const manualCount = totalCount - safeCount;

  // Breakdown of affected fields
  const fieldCounts: Record<string, number> = {};
  for (const f of selectedFindings) {
    fieldCounts[f.fieldName] = (fieldCounts[f.fieldName] || 0) + 1;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-20">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Confirm Data Cleaning Execution
              </h3>
              <p className="text-xs text-gray-500">
                Review proposed database changes before transactional apply
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isApplying}
            className="rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4 text-xs text-gray-700">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-emerald-50/50 p-3 border border-emerald-100">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                Total Changes
              </span>
              <span className="text-xl font-black text-emerald-950">
                {totalCount}
              </span>
              <span className="text-[10px] text-emerald-700 block mt-0.5">
                {safeCount} automated safe proposals
              </span>
            </div>

            <div className="rounded-xl bg-gray-50 p-3 border border-gray-200">
              <span className="text-[10px] uppercase font-bold text-gray-500 block">
                Affected Fields
              </span>
              <div className="mt-1 flex flex-wrap gap-1">
                {Object.entries(fieldCounts).map(([field, count]) => (
                  <span
                    key={field}
                    className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-gray-200 text-gray-800"
                  >
                    {field}: {count}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {manualCount > 0 && (
            <div className="rounded-xl bg-amber-50 p-3 border border-amber-200 flex items-start gap-2.5 text-amber-900">
              <AlertTriangle className="size-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <span className="font-bold">Manual Review Notice:</span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  You have selected {manualCount} item(s) flagged as requiring human scrutiny. Please verify their proposed values carefully.
                </p>
              </div>
            </div>
          )}

          <div className="rounded-xl bg-[#f8faf9] p-3.5 border border-gray-200 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-gray-900 text-xs">
              <Lock className="size-3.5 text-emerald-700" />
              Enterprise Data Safety Guarantees:
            </div>
            <ul className="space-y-1 text-[11px] text-gray-600 list-disc pl-4">
              <li>
                Updates are executed within an <strong>ACID transaction</strong> with automatic rollback on error.
              </li>
              <li>
                Strict <strong>Field Whitelist</strong> ensures only authorized contact and profile attributes are modified.
              </li>
              <li>
                Full <strong>Audit Log</strong> recorded with previous values, new values, user ID, and timestamp.
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isApplying}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={isApplying}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-sm"
          >
            {isApplying ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Applying in Transaction...
              </>
            ) : (
              <>
                <CheckCircle2 className="size-3.5" />
                Confirm &amp; Apply Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
