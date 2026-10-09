"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Plus,
  Save,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SequenceStatusBadge } from "./SequenceStatusBadge";
import { StepBuilderItem } from "./StepBuilderItem";
import { VisualFlowTimeline } from "./VisualFlowTimeline";
import { CadenceSimulatorModal } from "./CadenceSimulatorModal";
import {
  getSequenceById,
  updateSequence,
  createSequence,
  createStep,
  updateStep,
} from "@/services/follow-up.service";
import type {
  FollowUpSequence,
  FollowUpStep,
  SequenceStatus,
} from "@/types/follow-up";

function getNextTempId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? `temp-step-${crypto.randomUUID()}`
    : `temp-step-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

interface StepBuilderWorkspaceProps {
  initialSequence?: FollowUpSequence | null;
  sequenceId?: string;
  isNew: boolean;
  onBack?: () => void;
}

function StepBuilderWorkspace({
  initialSequence,
  sequenceId,
  isNew,
  onBack,
}: StepBuilderWorkspaceProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = React.useState(initialSequence?.name || "");
  const [description, setDescription] = React.useState(
    initialSequence?.description || "",
  );
  const [status, setStatus] = React.useState<SequenceStatus>(
    initialSequence?.status || "ACTIVE",
  );

  const [steps, setSteps] = React.useState<FollowUpStep[]>(() => {
    if (initialSequence?.steps && initialSequence.steps.length > 0) {
      return [...initialSequence.steps].sort(
        (a, b) => a.stepOrder - b.stepOrder,
      );
    }
    if (isNew) {
      return [
        {
          id: getNextTempId(),
          sequenceId: "",
          stepOrder: 1,
          delayMinutes: 0,
          channel: "EMAIL",
          actionType: "SEND_EMAIL",
          subjectTemplate: "Welcome to our CRM Platform, {{firstName}}!",
          contentTemplate:
            "Hi {{firstName}},\n\nThank you for reaching out to us. We would love to learn more about {{companyName}} and explore how we can help you streamline operations.\n\nBest regards,\nThe Sales Team",
          conditions: null,
          metadata: null,
          isActive: true,
        },
      ];
    }
    return [];
  });

  const [focusedStepId, setFocusedStepId] = React.useState<string | undefined>();
  const [isSimulatorOpen, setIsSimulatorOpen] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<{
    type: "success" | "error" | null;
    message: string | null;
  }>({ type: null, message: null });

  // Validation
  const validationErrors = React.useMemo(() => {
    const errors: string[] = [];
    if (!name.trim()) errors.push("Sequence name is required.");
    if (steps.length === 0) errors.push("Sequence must contain at least 1 step.");

    steps.forEach((step, idx) => {
      const stepNum = idx + 1;
      if (step.channel === "EMAIL" && !step.subjectTemplate?.trim()) {
        errors.push(`Step #${stepNum}: Email subject is required.`);
      }
      if (!step.contentTemplate?.trim()) {
        errors.push(`Step #${stepNum}: Content/Message template is required.`);
      }
      if (step.delayMinutes === undefined || step.delayMinutes < 0) {
        errors.push(`Step #${stepNum}: Delay value must be 0 or greater.`);
      }
    });

    return errors;
  }, [name, steps]);

  // Duplicate step
  const handleDuplicateStep = (index: number) => {
    const source = steps[index];
    const duplicated: FollowUpStep = {
      ...source,
      id: getNextTempId(),
      stepOrder: index + 2,
      conditions: source.conditions
        ? JSON.parse(JSON.stringify(source.conditions))
        : null,
    };
    setSteps((prev) => {
      const copy = [...prev];
      copy.splice(index + 1, 0, duplicated);
      return copy.map((s, idx) => ({ ...s, stepOrder: idx + 1 }));
    });
    setFocusedStepId(duplicated.id);
  };

  // Reorder steps
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setSteps((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy.map((s, idx) => ({ ...s, stepOrder: idx + 1 }));
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === steps.length - 1) return;
    setSteps((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy.map((s, idx) => ({ ...s, stepOrder: idx + 1 }));
    });
  };

  // Add new step
  const handleAddStep = (channel: string = "EMAIL") => {
    const nextOrder = steps.length + 1;
    const defaultDelay = nextOrder === 1 ? 0 : 1440;
    let defaultAction = "SEND_EMAIL";
    let defaultSubject = `Follow-up regarding {{companyName}}`;

    if (channel === "SMS") {
      defaultAction = "SEND_SMS";
      defaultSubject = "";
    } else if (channel === "CALL") {
      defaultAction = "SCHEDULE_CALL";
      defaultSubject = "";
    } else if (channel === "TASK") {
      defaultAction = "CREATE_TASK";
      defaultSubject = "";
    }

    const newStep: FollowUpStep = {
      id: getNextTempId(),
      sequenceId: sequenceId || "",
      stepOrder: nextOrder,
      delayMinutes: defaultDelay,
      channel,
      actionType: defaultAction,
      subjectTemplate: defaultSubject || null,
      contentTemplate: `Hi {{firstName}},\n\nFollowing up on our previous note. Let us know if you have questions!`,
      conditions: null,
      metadata: null,
      isActive: true,
    };

    setSteps((prev) => [...prev, newStep]);
    setFocusedStepId(newStep.id);
  };

  // Delete step
  const handleDeleteStep = (index: number) => {
    setSteps((prev) => {
      const filtered = prev.filter((_, idx) => idx !== index);
      return filtered.map((s, idx) => ({ ...s, stepOrder: idx + 1 }));
    });
  };

  // Update step
  const handleUpdateStep = (updated: FollowUpStep, index: number) => {
    setSteps((prev) => {
      const copy = [...prev];
      copy[index] = updated;
      return copy;
    });
  };

  // Scroll to step
  const scrollToStep = (id: string) => {
    setFocusedStepId(id);
    const el = document.getElementById(`step-card-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      let currentSeqId = sequenceId;

      // 1. Create or Update sequence
      if (isNew) {
        const created = await createSequence({
          name: name.trim(),
          description: description.trim() || undefined,
          status,
        });
        currentSeqId = created.id;
      } else {
        await updateSequence(currentSeqId as string, {
          name: name.trim(),
          description: description.trim() || undefined,
          status,
        });
      }

      // 2. Persist steps sequentially
      for (const step of steps) {
        const stepPayload = {
          stepOrder: step.stepOrder,
          delayMinutes: step.delayMinutes,
          channel: step.channel,
          actionType: step.actionType,
          subjectTemplate: step.subjectTemplate ?? undefined,
          contentTemplate: step.contentTemplate ?? undefined,
          conditions: step.conditions ?? undefined,
          metadata: step.metadata ?? undefined,
          isActive: step.isActive,
        };

        if (step.id && !step.id.startsWith("temp-")) {
          await updateStep(step.id, stepPayload);
        } else {
          await createStep(currentSeqId as string, stepPayload);
        }
      }

      return currentSeqId;
    },
    onSuccess: (savedSeqId) => {
      queryClient.invalidateQueries({ queryKey: ["sequence", savedSeqId] });
      queryClient.invalidateQueries({ queryKey: ["sequences"] });
      setSaveStatus({
        type: "success",
        message: "Sequence and all cadence steps saved successfully!",
      });

      if (isNew && savedSeqId) {
        router.push(`/follow-ups/sequences/${savedSeqId}`);
      }
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Failed to save sequence";
      setSaveStatus({
        type: "error",
        message,
      });
    },
  });

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 border-b border-[#e2e8e4] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => (onBack ? onBack() : router.push("/follow-ups"))}
            className="size-9 p-0 text-gray-500 hover:text-gray-900"
            title="Back to sequences"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                UC05 · Cadence Studio
              </span>
              <SequenceStatusBadge status={status} />
            </div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              {isNew ? "Create New Follow-up Sequence" : name || "Edit Sequence"}
            </h2>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Simulator button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsSimulatorOpen(true)}
            className="text-xs font-semibold text-emerald-800 border-emerald-300 hover:bg-emerald-50 h-9"
          >
            <Sparkles className="size-3.5 mr-1.5 text-emerald-600" />
            Simulate Cadence
          </Button>

          {/* Save button */}
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setSaveStatus({ type: null, message: null });
              saveMutation.mutate();
            }}
            disabled={saveMutation.isPending || validationErrors.length > 0}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs h-9 shadow-sm"
          >
            {saveMutation.isPending ? (
              <span className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent mr-1.5" />
            ) : (
              <Save className="size-3.5 mr-1.5" />
            )}
            {isNew ? "Publish Sequence" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Save Notification Feedback */}
      {saveStatus.message && (
        <div
          className={`flex items-center justify-between rounded-xl p-4 text-xs font-semibold transition-all ${
            saveStatus.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {saveStatus.type === "success" ? (
              <CheckCircle2 className="size-4 text-emerald-600" />
            ) : (
              <AlertCircle className="size-4 text-rose-600" />
            )}
            <span>{saveStatus.message}</span>
          </div>
          <button
            onClick={() => setSaveStatus({ type: null, message: null })}
            className="text-gray-400 hover:text-gray-700"
          >
            &times;
          </button>
        </div>
      )}

      {/* Sequence Metadata Card */}
      <div className="rounded-2xl border border-[#e2e8e4] bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Sequence Details
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Name */}
          <div className="md:col-span-2 space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">
              Sequence Name <span className="text-rose-500">*</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Inbound Demo Request - High Priority Outreach"
              maxLength={150}
              className="text-xs font-medium"
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">Sequence Status</Label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as SequenceStatus)}
              className="text-xs font-medium"
            >
              <option value="ACTIVE">ACTIVE (Ready to trigger)</option>
              <option value="DRAFT">DRAFT (In progress)</option>
              <option value="PAUSED">PAUSED (Temporarily suspended)</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </Select>
          </div>

          {/* Description */}
          <div className="md:col-span-3 space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">
              Description / Business Objective
            </Label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the target audience and goal of this cadence..."
              className="text-xs"
            />
          </div>
        </div>
      </div>

      {/* Visual Flow Timeline */}
      <VisualFlowTimeline
        steps={steps}
        selectedStepId={focusedStepId}
        onSelectStep={scrollToStep}
      />

      {/* Steps Builder Section */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Sequence Steps ({steps.length})
            </h3>
            <p className="text-xs text-gray-500">
              Configure delivery schedule, communication channels, and personalized templates.
            </p>
          </div>

          {/* Quick Add Buttons */}
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddStep("EMAIL")}
              className="text-xs h-8 px-2.5 font-semibold"
            >
              <Plus className="size-3 mr-1" />
              + Email Step
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddStep("SMS")}
              className="text-xs h-8 px-2.5 font-semibold"
            >
              <Plus className="size-3 mr-1" />
              + SMS Step
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddStep("CALL")}
              className="text-xs h-8 px-2.5 font-semibold"
            >
              <Plus className="size-3 mr-1" />
              + Call Step
            </Button>
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-4">
          {steps.map((step, idx) => (
            <StepBuilderItem
              key={step.id || `step-${idx}`}
              step={step}
              index={idx}
              totalSteps={steps.length}
              onChange={(updated) => handleUpdateStep(updated, idx)}
              onMoveUp={() => handleMoveUp(idx)}
              onMoveDown={() => handleMoveDown(idx)}
              onDelete={() => handleDeleteStep(idx)}
              onDuplicate={() => handleDuplicateStep(idx)}
              isFocused={focusedStepId === step.id}
            />
          ))}

          {/* Add Step Card at bottom */}
          <div className="rounded-2xl border-2 border-dashed border-[#e2e8e4] bg-[#fafcfa] p-8 text-center transition-colors hover:border-emerald-400">
            <div className="max-w-md mx-auto space-y-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 mx-auto">
                <Plus className="size-5" />
              </div>
              <h4 className="text-sm font-bold text-gray-800">
                Extend this Follow-up Sequence
              </h4>
              <p className="text-xs text-gray-500">
                Add follow-up touches like automated emails, SMS reminders, or manual sales calls.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <Button
                  type="button"
                  onClick={() => handleAddStep("EMAIL")}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold h-8 shadow-xs"
                >
                  <Plus className="size-3.5 mr-1" />
                  Add Email Step
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAddStep("SMS")}
                  className="text-xs font-semibold h-8"
                >
                  Add SMS Step
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAddStep("CALL")}
                  className="text-xs font-semibold h-8"
                >
                  Add Call Step
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAddStep("TASK")}
                  className="text-xs font-semibold h-8"
                >
                  Add Task Step
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Validation alert if errors exist */}
      {validationErrors.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-1.5 text-xs text-amber-900">
          <div className="flex items-center gap-2 font-bold text-amber-950">
            <AlertCircle className="size-4 text-amber-600" />
            <span>Complete required fields before saving:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px] text-amber-800">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Cadence Simulator Modal */}
      <CadenceSimulatorModal
        sequence={{ name, description, status }}
        steps={steps}
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />
    </div>
  );
}

interface StepBuilderProps {
  sequenceId?: string;
  onBack?: () => void;
}

export function StepBuilder({ sequenceId, onBack }: StepBuilderProps) {
  const router = useRouter();
  const isNew = !sequenceId || sequenceId === "new";

  const {
    data: sequenceData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["sequence", sequenceId],
    queryFn: () => getSequenceById(sequenceId as string),
    enabled: !isNew && Boolean(sequenceId),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="size-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <span>Loading sequence configuration...</span>
        </div>
      </div>
    );
  }

  if (isError && !isNew) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
        <AlertCircle className="size-8 text-rose-600 mx-auto" />
        <h3 className="text-base font-bold text-rose-900">Sequence Not Found</h3>
        <p className="text-xs text-rose-700">
          The follow-up sequence could not be loaded or was removed.
        </p>
        <Button
          onClick={() => (onBack ? onBack() : router.push("/follow-ups"))}
          variant="outline"
          className="text-xs"
        >
          Return to Sequences
        </Button>
      </div>
    );
  }

  return (
    <StepBuilderWorkspace
      key={sequenceData?.id ?? (isNew ? "new" : "loading")}
      initialSequence={sequenceData}
      sequenceId={sequenceId}
      isNew={isNew}
      onBack={onBack}
    />
  );
}
