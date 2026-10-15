"use client";

import * as React from "react";
import { Filter, Layers, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CreateScanRequest } from "@/types/data-cleaning";

interface ScopeSelectorProps {
  onStartScan: (req: CreateScanRequest) => void;
  isLoading: boolean;
}

export function ScopeSelector({ onStartScan, isLoading }: ScopeSelectorProps) {
  const [scope, setScope] = React.useState<"ALL" | "FILTER">("ALL");
  const [status, setStatus] = React.useState<string>("");
  const [search, setSearch] = React.useState<string>("");
  const [limit, setLimit] = React.useState<number>(100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const req: CreateScanRequest = {
      scope,
      filter:
        scope === "FILTER"
          ? {
              status: status || undefined,
              search: search.trim() || undefined,
              limit: Number(limit) || 100,
            }
          : undefined,
    };
    onStartScan(req);
  };

  return (
    <Card className="border border-emerald-100/80 bg-white shadow-xs">
      <CardHeader className="pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <Sparkles className="size-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-gray-900">
                Data Cleaning Scope Selection
              </CardTitle>
              <p className="text-[11px] text-gray-500">
                Choose the target lead dataset for automated rule checking and AI remediation
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Option 1: ALL */}
            <div
              onClick={() => setScope("ALL")}
              className={`cursor-pointer rounded-xl border p-3.5 transition-all flex items-start gap-3 ${
                scope === "ALL"
                  ? "border-emerald-600 bg-emerald-50/30 text-emerald-950 ring-1 ring-emerald-600"
                  : "border-gray-200 bg-white hover:border-gray-300 text-gray-700"
              }`}
            >
              <div
                className={`mt-0.5 flex size-5 items-center justify-center rounded-full border ${
                  scope === "ALL"
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-gray-300 bg-white"
                }`}
              >
                {scope === "ALL" && (
                  <span className="size-1.5 rounded-full bg-white" />
                )}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Layers className="size-3.5 text-emerald-700" />
                  All Active Leads
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Scan the entire lead database. Recommended for monthly quality audits and deduplication.
                </p>
              </div>
            </div>

            {/* Option 2: FILTER */}
            <div
              onClick={() => setScope("FILTER")}
              className={`cursor-pointer rounded-xl border p-3.5 transition-all flex items-start gap-3 ${
                scope === "FILTER"
                  ? "border-emerald-600 bg-emerald-50/30 text-emerald-950 ring-1 ring-emerald-600"
                  : "border-gray-200 bg-white hover:border-gray-300 text-gray-700"
              }`}
            >
              <div
                className={`mt-0.5 flex size-5 items-center justify-center rounded-full border ${
                  scope === "FILTER"
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-gray-300 bg-white"
                }`}
              >
                {scope === "FILTER" && (
                  <span className="size-1.5 rounded-full bg-white" />
                )}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Filter className="size-3.5 text-emerald-700" />
                  Targeted Filter
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Focus scan on specific pipeline stages, search keywords, or smaller lead batches.
                </p>
              </div>
            </div>
          </div>

          {/* Filter options if FILTER selected */}
          {scope === "FILTER" && (
            <div className="rounded-xl bg-[#f8faf9] p-4 border border-gray-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in-50">
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                  Lead Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-8 rounded-lg border border-gray-300 bg-white px-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="">All Statuses</option>
                  <option value="NEW">NEW</option>
                  <option value="QUALIFYING">QUALIFYING</option>
                  <option value="QUALIFIED">QUALIFIED</option>
                  <option value="CONTACTED">CONTACTED</option>
                  <option value="LOST">LOST</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                  Search Keyword
                </label>
                <Input
                  type="text"
                  placeholder="Name, email, company..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                  Max Batch Size
                </label>
                <Input
                  type="number"
                  min={10}
                  max={1000}
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              disabled={isLoading}
              className="h-9 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
            >
              <Play className="size-3.5 fill-current" />
              {isLoading ? "Initiating Scan..." : "Start AI Quality Scan"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
