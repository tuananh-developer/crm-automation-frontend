"use client";

import * as React from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  EyeOff,
  Filter,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DataCleaningFinding, IssueType, Severity } from "@/types/data-cleaning";

interface FindingsTableProps {
  findings: DataCleaningFinding[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAllSafe: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onOpenApplyModal: () => void;
  isApplying: boolean;
}

export function FindingsTable({
  findings,
  selectedIds,
  onToggleSelect,
  onSelectAllSafe,
  onSelectAll,
  onClearSelection,
  onOpenApplyModal,
  isApplying,
}: FindingsTableProps) {
  // Local state for filtering & dismissed items
  const [severityFilter, setSeverityFilter] = React.useState<string>("ALL");
  const [issueTypeFilter, setIssueTypeFilter] = React.useState<string>("ALL");
  const [safeOnly, setSafeOnly] = React.useState(false);
  const [dismissedIds, setDismissedIds] = React.useState<Set<string>>(new Set());

  // Filter visible findings
  const visibleFindings = React.useMemo(() => {
    return findings.filter((f) => {
      if (dismissedIds.has(f.id)) return false;
      if (severityFilter !== "ALL" && f.severity !== severityFilter) return false;
      if (issueTypeFilter !== "ALL" && f.issueType !== issueTypeFilter) return false;
      if (safeOnly && !f.safeToApply) return false;
      return true;
    });
  }, [findings, dismissedIds, severityFilter, issueTypeFilter, safeOnly]);

  const safeCount = findings.filter((f) => f.safeToApply && !dismissedIds.has(f.id)).length;

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  };

  const getSeverityBadge = (sev: Severity) => {
    switch (sev) {
      case "CRITICAL":
        return (
          <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
            <ShieldAlert className="size-3" /> CRITICAL
          </span>
        );
      case "HIGH":
        return (
          <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="size-3" /> HIGH
          </span>
        );
      case "MEDIUM":
        return (
          <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
            MEDIUM
          </span>
        );
      case "LOW":
        return (
          <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            LOW
          </span>
        );
    }
  };

  const getIssueLabel = (type: IssueType) => {
    switch (type) {
      case "DUPLICATE_CANDIDATE":
        return "Duplicate Lead Conflict";
      case "INVALID_EMAIL":
        return "Invalid Email Syntax";
      case "INVALID_WEBSITE":
        return "Invalid Website Format";
      case "INCONSISTENT_PHONE":
        return "Inconsistent Phone Digits";
      case "MISSING_FIELD":
        return "Missing Required Field";
      case "WHITESPACE_TRIM":
        return "Excess Whitespace";
      case "CASE_NORMALIZATION":
        return "Case Normalization";
      case "DOMAIN_MISMATCH":
        return "Company / Domain Mismatch";
      default:
        return type;
    }
  };

  if (!findings || findings.length === 0) {
    return (
      <Card className="border border-emerald-200 bg-emerald-50/20 shadow-xs">
        <CardContent className="p-8 text-center space-y-2">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="size-6" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">
            Pipeline Clean — No Quality Issues Detected
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            All scanned lead records satisfy email validation, URL formats, phone standards, and uniqueness criteria.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtering Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-gray-700 flex items-center gap-1">
            <Filter className="size-3.5 text-emerald-700" /> Filters:
          </span>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="h-8 rounded-lg border border-gray-200 bg-gray-50 px-2 text-xs text-gray-700 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={issueTypeFilter}
            onChange={(e) => setIssueTypeFilter(e.target.value)}
            className="h-8 rounded-lg border border-gray-200 bg-gray-50 px-2 text-xs text-gray-700 focus:outline-none"
          >
            <option value="ALL">All Issue Types</option>
            <option value="DUPLICATE_CANDIDATE">Duplicate Candidate</option>
            <option value="INVALID_EMAIL">Invalid Email</option>
            <option value="INVALID_WEBSITE">Invalid Website</option>
            <option value="INCONSISTENT_PHONE">Inconsistent Phone</option>
            <option value="MISSING_FIELD">Missing Field</option>
            <option value="CASE_NORMALIZATION">Case Normalization</option>
            <option value="WHITESPACE_TRIM">Whitespace Trim</option>
            <option value="DOMAIN_MISMATCH">Domain Mismatch</option>
          </select>

          <button
            type="button"
            onClick={() => setSafeOnly(!safeOnly)}
            className={`h-8 rounded-lg px-2.5 text-xs font-medium border transition-colors flex items-center gap-1 ${
              safeOnly
                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
            }`}
          >
            <ShieldCheck className="size-3.5" />
            Safe to Apply Only
          </button>
        </div>

        {/* Selection Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectAllSafe}
            className="h-8 text-xs border-emerald-200 text-emerald-800 hover:bg-emerald-50 font-semibold"
          >
            <ShieldCheck className="size-3.5 mr-1" />
            Select All Safe ({safeCount})
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onSelectAll}
            className="h-8 text-xs text-gray-700 hover:bg-gray-100"
          >
            Select All ({visibleFindings.length})
          </Button>

          {selectedIds.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="h-8 text-xs text-gray-500 hover:text-gray-900"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Findings Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200/80 bg-white shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-gray-200 bg-[#fafbfa] text-gray-600">
              <th className="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={
                    visibleFindings.length > 0 &&
                    visibleFindings.every((f) => selectedIds.includes(f.id))
                  }
                  onChange={(e) => {
                    if (e.target.checked) onSelectAll();
                    else onClearSelection();
                  }}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
              </th>
              <th className="py-3 px-3 font-semibold text-gray-700">Lead Record</th>
              <th className="py-3 px-3 font-semibold text-gray-700">Field &amp; Issue</th>
              <th className="py-3 px-3 font-semibold text-gray-700">Current vs Proposed</th>
              <th className="py-3 px-3 font-semibold text-gray-700">AI Confidence &amp; Rationale</th>
              <th className="py-3 px-3 font-semibold text-gray-700 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visibleFindings.map((finding) => {
              const isSelected = selectedIds.includes(finding.id);

              return (
                <tr
                  key={finding.id}
                  className={`transition-colors ${
                    isSelected ? "bg-emerald-50/40" : "hover:bg-gray-50/60"
                  }`}
                >
                  {/* Checkbox */}
                  <td className="py-3.5 px-3 text-center align-top">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={!finding.proposedValue}
                      onChange={() => onToggleSelect(finding.id)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </td>

                  {/* Lead Info */}
                  <td className="py-3.5 px-3 align-top">
                    <div className="font-bold text-gray-900 leading-tight">
                      {finding.leadIdentifier || "Unknown Lead"}
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                      ID: {finding.recordId}
                    </div>
                  </td>

                  {/* Field & Issue */}
                  <td className="py-3.5 px-3 align-top space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-semibold text-[11px] text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">
                        {finding.fieldName}
                      </span>
                      {getSeverityBadge(finding.severity)}
                    </div>
                    <div className="text-[11px] font-semibold text-gray-700">
                      {getIssueLabel(finding.issueType)}
                    </div>
                  </td>

                  {/* Current vs Proposed */}
                  <td className="py-3.5 px-3 align-top max-w-xs space-y-1">
                    <div className="text-gray-500">
                      <span className="text-[10px] font-bold text-gray-400 block uppercase">
                        Current:
                      </span>
                      <span className="font-mono text-[11px] line-through text-rose-700 bg-rose-50 px-1 py-0.5 rounded break-all">
                        {finding.currentValue !== null && finding.currentValue !== undefined
                          ? String(finding.currentValue)
                          : "<empty>"}
                      </span>
                    </div>

                    {finding.proposedValue ? (
                      <div className="text-gray-900">
                        <span className="text-[10px] font-bold text-emerald-600 block uppercase flex items-center gap-1">
                          <ArrowRight className="size-2.5" /> Proposed Clean:
                        </span>
                        <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-100 px-1 py-0.5 rounded break-all">
                          {String(finding.proposedValue)}
                        </span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-amber-700 italic">
                        Manual input required (no auto-fill)
                      </div>
                    )}
                  </td>

                  {/* Confidence & Rationale */}
                  <td className="py-3.5 px-3 align-top max-w-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          finding.confidence >= 0.9
                            ? "bg-emerald-100 text-emerald-800"
                            : finding.confidence >= 0.75
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        <Sparkles className="size-2.5" />
                        {Math.round(finding.confidence * 100)}% Confidence
                      </span>

                      {finding.safeToApply ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          <ShieldCheck className="size-2.5" /> Safe
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          <AlertTriangle className="size-2.5" /> Manual Check
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-gray-600 leading-relaxed">
                      {finding.reason}
                    </p>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-3 align-top text-right">
                    <button
                      type="button"
                      onClick={() => handleDismiss(finding.id)}
                      className="p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100 transition-colors"
                      title="Dismiss this finding"
                    >
                      <EyeOff className="size-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Floating Sticky Apply Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky bottom-6 z-30 mx-auto flex max-w-xl items-center justify-between gap-4 rounded-2xl bg-gray-900 p-4 text-white shadow-xl animate-in slide-in-from-bottom-3">
          <div className="space-y-0.5">
            <div className="text-xs font-bold flex items-center gap-1.5 text-emerald-400">
              <Check className="size-4" />
              {selectedIds.length} remediation change(s) selected
            </div>
            <p className="text-[11px] text-gray-400">
              Will be applied atomically in a database transaction with Audit Log
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="text-xs text-gray-300 hover:text-white hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={onOpenApplyModal}
              disabled={isApplying}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
            >
              Review &amp; Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
