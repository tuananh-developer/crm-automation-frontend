import { CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ApplyCleaningResponse } from "@/types/data-cleaning";

interface ApplySummaryCardProps {
  response: ApplyCleaningResponse;
  onDismiss: () => void;
}

export function ApplySummaryCard({ response, onDismiss }: ApplySummaryCardProps) {
  return (
    <Card className="border border-emerald-200 bg-white shadow-md animate-in fade-in-50">
      <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
            <ShieldCheck className="size-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-gray-900">
              Data Cleaning Execution Report
            </CardTitle>
            <p className="text-[11px] text-gray-500">
              Changes successfully applied to PostgreSQL database in ACID transaction
            </p>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-xs text-gray-400 hover:text-gray-700 underline"
        >
          Close Report
        </button>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-200 text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">
              Applied Successfully
            </span>
            <span className="text-2xl font-black text-emerald-900">
              {response.appliedCount}
            </span>
          </div>

          <div className="rounded-xl bg-amber-50 p-3 border border-amber-200 text-center">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">
              Skipped / Protected
            </span>
            <span className="text-2xl font-black text-amber-900">
              {response.skippedCount}
            </span>
          </div>

          <div className="rounded-xl bg-gray-50 p-3 border border-gray-200 text-center">
            <span className="text-[10px] uppercase font-bold text-gray-600 block">
              Audit Logs Created
            </span>
            <span className="text-2xl font-black text-gray-900">
              {response.appliedCount}
            </span>
          </div>
        </div>

        {/* Breakdown table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 text-xs">
          <table className="w-full text-left">
            <thead className="bg-[#f8faf9] text-gray-600 border-b border-gray-200">
              <tr>
                <th className="p-2.5 font-semibold">Status</th>
                <th className="p-2.5 font-semibold">Field</th>
                <th className="p-2.5 font-semibold">Previous Value</th>
                <th className="p-2.5 font-semibold">New Applied Value</th>
                <th className="p-2.5 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {response.results.map((res, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50">
                  <td className="p-2.5">
                    {res.status === "APPLIED" ? (
                      <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="size-3" /> APPLIED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800">
                        <AlertCircle className="size-3" /> SKIPPED
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 font-mono text-[11px] font-bold text-gray-800">
                    {res.fieldName || "—"}
                  </td>
                  <td className="p-2.5 text-gray-500 font-mono text-[11px] max-w-xs truncate">
                    {res.oldValue !== null && res.oldValue !== undefined
                      ? String(res.oldValue)
                      : "—"}
                  </td>
                  <td className="p-2.5 text-emerald-800 font-mono text-[11px] font-bold max-w-xs truncate">
                    {res.newValue !== null && res.newValue !== undefined
                      ? String(res.newValue)
                      : "—"}
                  </td>
                  <td className="p-2.5 text-gray-500 text-[11px]">
                    {res.skipReason || "Updated with AuditLog"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
