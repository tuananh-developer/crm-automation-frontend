"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Play,
  Pause,
  Sliders,
  UserPlus,
  ArrowRight,
  Sparkles,
  FileEdit,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { SequenceStatusBadge } from "./SequenceStatusBadge";
import { SequenceModal } from "./SequenceModal";
import { EnrollLeadDialog } from "./EnrollLeadDialog";
import { ChannelBadge } from "./ChannelBadge";
import { getSequences, updateSequence } from "@/services/follow-up.service";
import type { FollowUpSequence, SequenceStatus } from "@/types/follow-up";

export function SequenceList() {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [sequenceToEdit, setSequenceToEdit] = React.useState<FollowUpSequence | null>(null);
  const [sequenceToEnroll, setSequenceToEnroll] = React.useState<FollowUpSequence | null>(null);

  // Fetch sequences
  const {
    data: sequences = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["sequences"],
    queryFn: () => getSequences(),
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({
      id,
      newStatus,
    }: {
      id: string;
      newStatus: SequenceStatus;
    }) => {
      return updateSequence(id, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sequences"] });
    },
  });

  // Filter & Search
  const filteredSequences = React.useMemo(() => {
    return sequences.filter((seq) => {
      const matchesSearch =
        seq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (seq.description &&
          seq.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === "ALL" || seq.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [sequences, searchTerm, statusFilter]);

  // Aggregate Stats
  const stats = React.useMemo(() => {
    const total = sequences.length;
    const active = sequences.filter((s) => s.status === "ACTIVE").length;
    const draft = sequences.filter((s) => s.status === "DRAFT").length;
    const totalSteps = sequences.reduce((sum, s) => sum + (s.steps?.length || 0), 0);
    return { total, active, draft, totalSteps };
  }, [sequences]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Total Sequences */}
        <Card className="border-[#e2e8e4] bg-white shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Total Sequences
            </p>
            <p className="text-2xl font-black text-gray-900">{stats.total}</p>
            <p className="text-[10px] text-gray-500">Configured cadences</p>
          </CardContent>
        </Card>

        {/* Active Cadences */}
        <Card className="border-emerald-200/80 bg-emerald-50/40 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Active Cadences
            </p>
            <p className="text-2xl font-black text-emerald-900">{stats.active}</p>
            <p className="text-[10px] text-emerald-700/80">Dispatched automatically</p>
          </CardContent>
        </Card>

        {/* Total Automated Steps */}
        <Card className="border-[#e2e8e4] bg-white shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Total Steps
            </p>
            <p className="text-2xl font-black text-gray-900">{stats.totalSteps}</p>
            <p className="text-[10px] text-gray-500">Touches &amp; actions built</p>
          </CardContent>
        </Card>

        {/* Draft Sequences */}
        <Card className="border-[#e2e8e4] bg-white shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Draft / Paused
            </p>
            <p className="text-2xl font-black text-gray-900">
              {stats.draft + sequences.filter((s) => s.status === "PAUSED").length}
            </p>
            <p className="text-[10px] text-gray-500">In design phase</p>
          </CardContent>
        </Card>
      </div>

      {/* Control Bar: Search, Filters, and New Sequence CTA */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#e2e8e4] bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search sequences by name or description..."
              className="pl-9 text-xs"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="w-36">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="DRAFT">DRAFT</option>
              <option value="PAUSED">PAUSED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </Select>
          </div>

          {/* Refresh button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="size-9 p-0 text-gray-500 hover:text-gray-900"
            title="Refresh sequence catalog"
          >
            <RefreshCw className={`size-4 ${isRefetching ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs h-9 shadow-sm"
          >
            <Plus className="size-4 mr-1.5" />
            Create Sequence
          </Button>
        </div>
      </div>

      {/* Sequences List / Table */}
      {isLoading ? (
        <div className="flex h-56 items-center justify-center">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="size-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            <span>Loading sequences...</span>
          </div>
        </div>
      ) : filteredSequences.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center space-y-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 mx-auto">
            <Sparkles className="size-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-gray-900">
              No Sequences Found
            </h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              {searchTerm || statusFilter !== "ALL"
                ? "No follow-up sequences matched your current search and filter criteria."
                : "Get started by building your first automated follow-up sequence with email, SMS, and task touches."}
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
          >
            <Plus className="size-4 mr-1.5" />
            Create First Sequence
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSequences.map((seq) => {
            const stepsCount = seq.steps?.length || 0;
            const uniqueChannels = Array.from(
              new Set(seq.steps?.map((s) => s.channel) || []),
            );

            return (
              <div
                key={seq.id}
                className="group rounded-2xl border border-[#e2e8e4] bg-white p-5 shadow-xs transition-all hover:border-emerald-300 hover:shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  {/* Left Column: Sequence Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-emerald-900 transition-colors">
                        <Link href={`/follow-ups/sequences/${seq.id}`}>
                          {seq.name}
                        </Link>
                      </h3>
                      <SequenceStatusBadge status={seq.status} />
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                        {stepsCount} {stepsCount === 1 ? "step" : "steps"}
                      </span>
                    </div>

                    {seq.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {seq.description}
                      </p>
                    )}

                    {/* Step Channels previews */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] text-gray-400">Channels:</span>
                      {uniqueChannels.length > 0 ? (
                        uniqueChannels.map((ch) => (
                          <ChannelBadge key={ch} channel={ch} size="sm" />
                        ))
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">
                          No steps configured yet
                        </span>
                      )}

                      <span className="text-[11px] text-gray-300">&bull;</span>
                      <span className="text-[11px] text-gray-400">
                        Created {new Date(seq.createdAt).toLocaleDateString()}
                      </span>
                      {seq.creator && (
                        <>
                          <span className="text-[11px] text-gray-300">&bull;</span>
                          <span className="text-[11px] text-gray-400">
                            By {seq.creator.fullName || seq.creator.email || "Admin"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3 lg:border-t-0 lg:pt-0">
                    {/* Status quick toggle */}
                    {seq.status === "ACTIVE" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toggleStatusMutation.mutate({
                            id: seq.id,
                            newStatus: "PAUSED",
                          })
                        }
                        className="text-xs text-amber-700 border-amber-200 hover:bg-amber-50 h-8"
                        title="Pause this cadence"
                      >
                        <Pause className="size-3 mr-1" />
                        Pause
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toggleStatusMutation.mutate({
                            id: seq.id,
                            newStatus: "ACTIVE",
                          })
                        }
                        className="text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 h-8"
                        title="Activate this cadence"
                      >
                        <Play className="size-3 mr-1" />
                        Activate
                      </Button>
                    )}

                    {/* Enroll Lead Action */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSequenceToEnroll(seq)}
                      className="text-xs h-8 text-gray-700 hover:text-gray-900 font-semibold"
                    >
                      <UserPlus className="size-3 mr-1.5 text-emerald-700" />
                      Enroll Lead
                    </Button>

                    {/* Quick Edit metadata */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSequenceToEdit(seq)}
                      className="size-8 p-0 text-gray-500 hover:text-gray-900"
                      title="Edit sequence details"
                    >
                      <FileEdit className="size-4" />
                    </Button>

                    {/* Open Visual Builder Button */}
                    <Button
                      asChild
                      size="sm"
                      className="bg-[#17221c] hover:bg-[#253930] text-white text-xs font-bold h-8 shadow-xs"
                    >
                      <Link href={`/follow-ups/sequences/${seq.id}`}>
                        <Sliders className="size-3 mr-1.5" />
                        Step Builder
                        <ArrowRight className="size-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <SequenceModal
        isOpen={isCreateModalOpen || Boolean(sequenceToEdit)}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSequenceToEdit(null);
        }}
        sequenceToEdit={sequenceToEdit}
      />

      {/* Enroll Lead Modal */}
      {sequenceToEnroll && (
        <EnrollLeadDialog
          sequence={sequenceToEnroll}
          isOpen={Boolean(sequenceToEnroll)}
          onClose={() => setSequenceToEnroll(null)}
        />
      )}
    </div>
  );
}
