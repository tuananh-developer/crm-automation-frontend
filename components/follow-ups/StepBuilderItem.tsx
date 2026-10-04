"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  Clock,
  Eye,
  FileCode,
  Sliders,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChannelBadge } from "./ChannelBadge";
import {
  DelayUnit,
  minutesToValueAndUnit,
  valueAndUnitToMinutes,
  formatDelayDescription,
} from "@/lib/delay-utils";
import { cn } from "@/lib/utils";
import type { FollowUpStep } from "@/types/follow-up";

interface StepBuilderItemProps {
  step: FollowUpStep;
  index: number;
  totalSteps: number;
  onChange: (updatedStep: FollowUpStep) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  isFocused?: boolean;
}

const TEMPLATE_VARIABLES = [
  { label: "{{firstName}}", desc: "Lead's first name (e.g. John)" },
  { label: "{{lastName}}", desc: "Lead's last name (e.g. Doe)" },
  { label: "{{companyName}}", desc: "Company name (e.g. Acme Corp)" },
  { label: "{{jobTitle}}", desc: "Title / Role (e.g. CTO)" },
  { label: "{{email}}", desc: "Email address" },
  { label: "{{phone}}", desc: "Phone number" },
];

const SAMPLE_LEAD_DATA: Record<string, string> = {
  "{{firstName}}": "Alex",
  "{{lastName}}": "Morgan",
  "{{companyName}}": "Apex Technologies",
  "{{jobTitle}}": "VP of Revenue",
  "{{email}}": "alex.morgan@apextech.io",
  "{{phone}}": "+1 (555) 234-5678",
};

export function StepBuilderItem({
  step,
  index,
  totalSteps,
  onChange,
  onMoveUp,
  onMoveDown,
  onDelete,
  isFocused,
}: StepBuilderItemProps) {
  const [showPreview, setShowPreview] = React.useState(false);
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [rawMetadata, setRawMetadata] = React.useState(
    step.metadata ? JSON.stringify(step.metadata, null, 2) : "",
  );
  const [metadataError, setMetadataError] = React.useState<string | null>(null);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const subjectInputRef = React.useRef<HTMLInputElement>(null);
  const [lastFocusedField, setLastFocusedField] = React.useState<"subject" | "content">("content");

  // Delay converter state
  const { value: delayVal, unit: delayUnit } = React.useMemo(
    () => minutesToValueAndUnit(step.delayMinutes),
    [step.delayMinutes],
  );

  const handleDelayChange = (newVal: number, newUnit: DelayUnit) => {
    const totalMinutes = valueAndUnitToMinutes(newVal, newUnit);
    onChange({
      ...step,
      delayMinutes: totalMinutes,
    });
  };

  const handleChannelChange = (newChannel: string) => {
    let defaultAction = "SEND_EMAIL";
    if (newChannel === "SMS" || newChannel === "MESSAGE") defaultAction = "SEND_SMS";
    else if (newChannel === "CALL") defaultAction = "SCHEDULE_CALL";
    else if (newChannel === "TASK") defaultAction = "CREATE_TASK";
    else if (newChannel === "WEBHOOK") defaultAction = "TRIGGER_WEBHOOK";

    onChange({
      ...step,
      channel: newChannel,
      actionType: defaultAction,
    });
  };

  const insertVariable = (variable: string) => {
    if (lastFocusedField === "subject" && step.channel === "EMAIL") {
      const input = subjectInputRef.current;
      const current = step.subjectTemplate || "";
      if (input && input.selectionStart !== null && input.selectionEnd !== null) {
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const updated = current.substring(0, start) + variable + current.substring(end);
        onChange({ ...step, subjectTemplate: updated });
        setTimeout(() => {
          input.focus();
          input.setSelectionRange(start + variable.length, start + variable.length);
        }, 0);
      } else {
        onChange({ ...step, subjectTemplate: current + variable });
      }
    } else {
      const textarea = textareaRef.current;
      const current = step.contentTemplate || "";
      if (textarea && textarea.selectionStart !== null && textarea.selectionEnd !== null) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const updated = current.substring(0, start) + variable + current.substring(end);
        onChange({ ...step, contentTemplate: updated });
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + variable.length, start + variable.length);
        }, 0);
      } else {
        onChange({ ...step, contentTemplate: current + (current ? " " : "") + variable });
      }
    }
  };

  // Render preview substituting variables
  const renderPreviewText = (text: string | null) => {
    if (!text) return "";
    let rendered = text;
    for (const [key, val] of Object.entries(SAMPLE_LEAD_DATA)) {
      rendered = rendered.replaceAll(key, val);
    }
    return rendered;
  };

  const handleMetadataChange = (val: string) => {
    setRawMetadata(val);
    if (!val.trim()) {
      setMetadataError(null);
      onChange({ ...step, metadata: null });
      return;
    }
    try {
      const parsed = JSON.parse(val);
      setMetadataError(null);
      onChange({ ...step, metadata: parsed });
    } catch {
      setMetadataError("Invalid JSON syntax");
    }
  };

  const isEmail = step.channel === "EMAIL";
  const hasSubjectError = isEmail && !step.subjectTemplate?.trim();
  const hasContentError = !step.contentTemplate?.trim();

  return (
    <div
      id={`step-card-${step.id}`}
      className={cn(
        "rounded-2xl border bg-white shadow-xs transition-all overflow-hidden",
        isFocused
          ? "border-emerald-500 ring-2 ring-emerald-500/20"
          : step.isActive === false
            ? "border-gray-200 bg-gray-50/50 opacity-75"
            : "border-[#e2e8e4] hover:border-gray-300",
      )}
    >
      {/* Step Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef2ef] bg-[#fafcfa] px-5 py-3.5">
        <div className="flex items-center gap-3">
          {/* Order Badge */}
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#17221c] text-white font-bold text-xs shadow-xs">
            #{step.stepOrder}
          </div>

          <ChannelBadge channel={step.channel} />

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
            <Clock className="size-3.5 text-gray-400" />
            <span>{formatDelayDescription(step.delayMinutes, step.stepOrder)}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Active status toggle */}
          <button
            type="button"
            onClick={() => onChange({ ...step, isActive: !step.isActive })}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border transition-colors",
              step.isActive !== false
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/60"
                : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200",
            )}
            title={step.isActive !== false ? "Step is active" : "Step is paused"}
          >
            <CheckCircle2 className="size-3.5" />
            {step.isActive !== false ? "Active" : "Disabled"}
          </button>

          {/* Move Up */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onMoveUp}
            disabled={index === 0}
            className="size-8 p-0 text-gray-500 hover:text-gray-900 disabled:opacity-30"
            title="Move step up"
          >
            <ArrowUp className="size-4" />
          </Button>

          {/* Move Down */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onMoveDown}
            disabled={index === totalSteps - 1}
            className="size-8 p-0 text-gray-500 hover:text-gray-900 disabled:opacity-30"
            title="Move step down"
          >
            <ArrowDown className="size-4" />
          </Button>

          {/* Delete step */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="size-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
            title="Delete this step"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Step Card Body Form */}
      <div className="p-5 space-y-5">
        {/* Row 1: Channel & Action & Timing */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Channel selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">Communication Channel</Label>
            <Select
              value={step.channel}
              onChange={(e) => handleChannelChange(e.target.value)}
              className="text-xs font-medium"
            >
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS / Text</option>
              <option value="CALL">Phone Call</option>
              <option value="TASK">Manual CRM Task</option>
              <option value="WEBHOOK">Webhook Trigger</option>
            </Select>
          </div>

          {/* Action Type */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">Action Type</Label>
            <Select
              value={step.actionType}
              onChange={(e) => onChange({ ...step, actionType: e.target.value })}
              className="text-xs font-medium"
            >
              {isEmail && <option value="SEND_EMAIL">Send Email</option>}
              {(step.channel === "SMS" || step.channel === "MESSAGE") && (
                <option value="SEND_SMS">Send SMS Message</option>
              )}
              {step.channel === "CALL" && (
                <>
                  <option value="SCHEDULE_CALL">Schedule Outreach Call</option>
                  <option value="LOG_CALL">Log Call Activity</option>
                </>
              )}
              {step.channel === "TASK" && (
                <option value="CREATE_TASK">Create Follow-up Task</option>
              )}
              {step.channel === "WEBHOOK" && (
                <option value="TRIGGER_WEBHOOK">Trigger Webhook Payload</option>
              )}
            </Select>
          </div>

          {/* Delay Interval Value */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">Delay Time</Label>
            <Input
              type="number"
              min="0"
              value={delayVal}
              onChange={(e) =>
                handleDelayChange(parseInt(e.target.value, 10) || 0, delayUnit)
              }
              className="text-xs font-medium"
              placeholder="0"
            />
          </div>

          {/* Delay Unit */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">Delay Unit</Label>
            <Select
              value={delayUnit}
              onChange={(e) =>
                handleDelayChange(delayVal, e.target.value as DelayUnit)
              }
              className="text-xs font-medium"
            >
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
            </Select>
          </div>
        </div>

        {/* Timing description helper */}
        <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-1.5 border border-gray-200/60 inline-flex items-center gap-1.5">
          <Clock className="size-3 text-emerald-600" />
          <span>Timing: </span>
          <strong className="text-gray-800">
            {formatDelayDescription(step.delayMinutes, step.stepOrder)}
          </strong>
        </p>

        {/* Email Subject field (shown when channel is EMAIL) */}
        {isEmail && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-gray-700">
                Email Subject Line <span className="text-rose-500">*</span>
              </Label>
              {hasSubjectError && (
                <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="size-3" /> Subject is required
                </span>
              )}
            </div>
            <Input
              ref={subjectInputRef}
              value={step.subjectTemplate || ""}
              onFocus={() => setLastFocusedField("subject")}
              onChange={(e) =>
                onChange({ ...step, subjectTemplate: e.target.value })
              }
              placeholder="e.g. Quick question regarding {{companyName}}'s sales workflow"
              className={cn("text-xs font-medium", hasSubjectError && "border-rose-400")}
            />
          </div>
        )}

        {/* Template Variables Helper */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
              <Tag className="size-3.5 text-emerald-700" />
              <span>Insert Lead Variables:</span>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 h-7 px-2.5"
            >
              <Eye className="size-3 mr-1" />
              {showPreview ? "Hide Live Preview" : "Show Live Preview"}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {TEMPLATE_VARIABLES.map((v) => (
              <button
                key={v.label}
                type="button"
                onClick={() => insertVariable(v.label)}
                title={v.desc}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 px-2 py-1 text-[11px] font-mono font-medium text-emerald-800 transition-colors shadow-2xs"
              >
                <span>+</span>
                <span>{v.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Template Editor */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-gray-700">
              Message Content / Instructions <span className="text-rose-500">*</span>
            </Label>
            {hasContentError && (
              <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                <AlertCircle className="size-3" /> Content is required
              </span>
            )}
          </div>
          <Textarea
            ref={textareaRef}
            rows={5}
            value={step.contentTemplate || ""}
            onFocus={() => setLastFocusedField("content")}
            onChange={(e) =>
              onChange({ ...step, contentTemplate: e.target.value })
            }
            placeholder={
              isEmail
                ? "Hi {{firstName}},\n\nI noticed {{companyName}} recently reached out regarding our CRM solution..."
                : "Hi {{firstName}}, follow up via phone to discuss {{companyName}} requirements."
            }
            className={cn("font-sans text-xs leading-relaxed", hasContentError && "border-rose-400")}
          />
        </div>

        {/* Live Preview Panel */}
        {showPreview && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
              <Sparkles className="size-3.5 text-emerald-600" />
              <span>Live Render Preview (Sample: Alex Morgan @ Apex Technologies)</span>
            </div>

            {isEmail && step.subjectTemplate && (
              <div className="border-b border-emerald-200/60 pb-2">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Subject Preview
                </p>
                <p className="text-xs font-bold text-gray-900 mt-0.5">
                  {renderPreviewText(step.subjectTemplate)}
                </p>
              </div>
            )}

            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Body Preview
              </p>
              <div className="text-xs text-gray-800 whitespace-pre-wrap font-sans mt-1 bg-white p-3 rounded-lg border border-emerald-100 shadow-2xs">
                {renderPreviewText(step.contentTemplate) || (
                  <span className="text-gray-400 italic">No content template written yet</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Advanced JSON Conditions / Metadata Toggle */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800"
          >
            <Sliders className="size-3.5" />
            <span>{showAdvanced ? "Hide Advanced Metadata" : "Show Advanced Step Metadata"}</span>
          </button>

          {showAdvanced && (
            <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  <FileCode className="size-3.5 text-gray-500" /> Custom Metadata (JSON)
                </span>
                {metadataError && (
                  <span className="text-[11px] text-rose-600 font-semibold">{metadataError}</span>
                )}
              </div>
              <Textarea
                rows={3}
                value={rawMetadata}
                onChange={(e) => handleMetadataChange(e.target.value)}
                placeholder='{\n  "priority": "HIGH",\n  "webhookEndpoint": "https://hooks.crm.local/v1"\n}'
                className="font-mono text-xs"
              />
              <p className="text-[10px] text-gray-400">
                Optional configuration passed to execution webhooks or analytics.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
