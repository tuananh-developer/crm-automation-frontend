"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Sparkles, Layers, FilePlus2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createSequence, createStep, updateSequence } from "@/services/follow-up.service";
import type { FollowUpSequence, SequenceStatus } from "@/types/follow-up";

interface SequenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sequenceToEdit?: FollowUpSequence | null;
}

const TEMPLATE_PRESETS = [
  {
    id: "scratch",
    title: "Blank Sequence",
    desc: "Start with an empty canvas and design custom steps",
    steps: [
      {
        stepOrder: 1,
        delayMinutes: 0,
        channel: "EMAIL",
        actionType: "SEND_EMAIL",
        subjectTemplate: "Welcome {{firstName}} to our platform!",
        contentTemplate:
          "Hi {{firstName}},\n\nThank you for connecting with us! How can we assist {{companyName}} today?\n\nBest,\nSales Team",
      },
    ],
  },
  {
    id: "inbound-3step",
    title: "Inbound Lead Welcome (3 Steps)",
    desc: "Welcome email (T+0), SMS check-in (T+24h), Sales call (T+3d)",
    steps: [
      {
        stepOrder: 1,
        delayMinutes: 0,
        channel: "EMAIL",
        actionType: "SEND_EMAIL",
        subjectTemplate: "Welcome to our CRM Platform, {{firstName}}!",
        contentTemplate:
          "Hi {{firstName}},\n\nThanks for reaching out! We're excited to help {{companyName}} scale customer acquisition.\n\nBest,\nAccount Executive",
      },
      {
        stepOrder: 2,
        delayMinutes: 1440, // 24 hours
        channel: "SMS",
        actionType: "SEND_SMS",
        subjectTemplate: null,
        contentTemplate:
          "Hi {{firstName}}, checking in from CRM team. Did you receive our overview email yesterday?",
      },
      {
        stepOrder: 3,
        delayMinutes: 4320, // 3 days
        channel: "CALL",
        actionType: "SCHEDULE_CALL",
        subjectTemplate: null,
        contentTemplate:
          "Discovery call with {{firstName}} ({{jobTitle}}) at {{companyName}} to review CRM requirements.",
      },
    ],
  },
  {
    id: "cold-outreach",
    title: "B2B Outbound Cadence (3 Steps)",
    desc: "Personalized intro, case study follow-up, and quick check-in",
    steps: [
      {
        stepOrder: 1,
        delayMinutes: 0,
        channel: "EMAIL",
        actionType: "SEND_EMAIL",
        subjectTemplate: "Quick question for {{companyName}}'s sales strategy",
        contentTemplate:
          "Hi {{firstName}},\n\nI noticed your leadership role at {{companyName}} and wanted to share how similar teams improved conversion by 35%.\n\nOpen to a 10-minute chat this week?",
      },
      {
        stepOrder: 2,
        delayMinutes: 2880, // 2 days
        channel: "EMAIL",
        actionType: "SEND_EMAIL",
        subjectTemplate: "Case study for {{companyName}}",
        contentTemplate:
          "Hi {{firstName}},\n\nHere is the recent customer case study I mentioned. Thought you might find the ROI benchmark relevant.\n\nBest regards,",
      },
      {
        stepOrder: 3,
        delayMinutes: 5760, // 4 days
        channel: "CALL",
        actionType: "SCHEDULE_CALL",
        subjectTemplate: null,
        contentTemplate:
          "Targeted follow-up call with {{firstName}} at {{companyName}}.",
      },
    ],
  },
];

interface FormProps {
  sequenceToEdit?: FollowUpSequence | null;
  onClose: () => void;
}

function SequenceModalForm({ sequenceToEdit, onClose }: FormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = Boolean(sequenceToEdit);

  const [name, setName] = React.useState(sequenceToEdit?.name || "");
  const [description, setDescription] = React.useState(sequenceToEdit?.description || "");
  const [status, setStatus] = React.useState<SequenceStatus>(sequenceToEdit?.status || "ACTIVE");
  const [selectedTemplate, setSelectedTemplate] = React.useState<string>("scratch");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Sequence name is required");

      if (isEdit && sequenceToEdit) {
        return updateSequence(sequenceToEdit.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          status,
        });
      }

      // Create new sequence
      const created = await createSequence({
        name: name.trim(),
        description: description.trim() || undefined,
        status,
      });

      // If preset template was selected, create initial steps
      const preset = TEMPLATE_PRESETS.find((p) => p.id === selectedTemplate);
      if (preset && preset.steps.length > 0) {
        for (const s of preset.steps) {
          await createStep(created.id, {
            stepOrder: s.stepOrder,
            delayMinutes: s.delayMinutes,
            channel: s.channel,
            actionType: s.actionType,
            subjectTemplate: s.subjectTemplate ?? undefined,
            contentTemplate: s.contentTemplate,
            isActive: true,
          });
        }
      }

      return created;
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["sequences"] });
      onClose();
      if (!isEdit && saved) {
        router.push(`/follow-ups/sequences/${saved.id}`);
      }
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to save sequence";
      setErrorMsg(msg);
    },
  });

  return (
    <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl border border-gray-200 space-y-5 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
            {isEdit ? <Layers className="size-5" /> : <FilePlus2 className="size-5" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {isEdit ? "Edit Sequence Settings" : "Create New Sequence"}
            </h3>
            <p className="text-xs text-gray-500">
              {isEdit
                ? "Update sequence name, objective, and activation status"
                : "Launch a new multi-channel outreach cadence"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="size-8 p-0 text-gray-400 hover:text-gray-700"
        >
          <X className="size-4" />
        </Button>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-800">
          <AlertCircle className="size-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Preset templates (only when creating new) */}
        {!isEdit && (
          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-emerald-600" />
              Select a Sequence Starter:
            </Label>
            <div className="grid grid-cols-1 gap-2">
              {TEMPLATE_PRESETS.map((p) => {
                const isSelected = selectedTemplate === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedTemplate(p.id);
                      if (!name || TEMPLATE_PRESETS.some((tp) => tp.title === name)) {
                        setName(p.title);
                      }
                    }}
                    className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-2xs"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-gray-900">{p.title}</span>
                      {isSelected && (
                        <CheckCircle2 className="size-4 text-emerald-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">{p.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Name input */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-700">
            Sequence Name <span className="text-rose-500">*</span>
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Inbound Demo Request - Fast Follow-up"
            maxLength={150}
            className="text-xs font-medium"
          />
        </div>

        {/* Status selector */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-700">Initial Status</Label>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as SequenceStatus)}
            className="text-xs font-medium"
          >
            <option value="ACTIVE">ACTIVE (Ready to trigger)</option>
            <option value="DRAFT">DRAFT (Under construction)</option>
            <option value="PAUSED">PAUSED</option>
            {isEdit && <option value="ARCHIVED">ARCHIVED</option>}
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-700">
            Description / Objective (Optional)
          </Label>
          <Textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Briefly describe the audience and goals..."
            className="text-xs"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
        <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !name.trim()}
          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
        >
          {mutation.isPending
            ? "Saving..."
            : isEdit
              ? "Save Changes"
              : "Create & Open Builder"}
        </Button>
      </div>
    </div>
  );
}

export function SequenceModal({
  isOpen,
  onClose,
  sequenceToEdit,
}: SequenceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <SequenceModalForm
        key={sequenceToEdit?.id ?? "new"}
        sequenceToEdit={sequenceToEdit}
        onClose={onClose}
      />
    </div>
  );
}
