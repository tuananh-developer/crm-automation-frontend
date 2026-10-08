"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Save, X } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SegmentCriteriaBuilder } from "./SegmentCriteriaBuilder";
import { Notice } from "./States";
import type { Segment, SegmentAssignmentType, SegmentCriteria } from "@/types/segment";

const assignmentTypes: SegmentAssignmentType[] = ["RULE", "AI"];

const segmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Segment name is required")
    .max(150, "Segment name must be 150 characters or less"),
  description: z.string().trim().max(2000, "Description is too long"),
  assignmentType: z
    .string()
    .refine((value) => assignmentTypes.includes(value as SegmentAssignmentType), {
      message: "Assignment type is required",
    }),
  isActive: z.boolean(),
  criteria: z.object({
    logic: z.enum(["AND", "OR"]),
    assignmentType: z
      .string()
      .refine(
        (value) => assignmentTypes.includes(value as SegmentAssignmentType),
        { message: "Assignment type is required" },
      ),
    conditions: z
      .array(
        z.object({
          field: z.string().min(1, "Field is required"),
          operator: z.string().min(1, "Operator is required"),
          value: z.string().trim().min(1, "Value is required"),
        }),
      )
      .min(1, "At least one condition is required"),
  }),
});

export type SegmentFormValues = {
  name: string;
  description: string;
  assignmentType: SegmentAssignmentType | "";
  isActive: boolean;
  criteria: SegmentCriteria;
};

/** Values handed to the caller once the form is valid. */
export type SegmentFormSubmitValues = Omit<
  SegmentFormValues,
  "name" | "description"
> & {
  name: string;
  description: string | null;
};

export function toSegmentFormValues(segment?: Segment | null): SegmentFormValues {
  const criteria = segment?.criteria;

  return {
    name: segment?.name ?? "",
    description: segment?.description ?? "",
    assignmentType: criteria?.assignmentType ?? "",
    isActive: segment?.isActive ?? true,
    criteria: {
      logic: criteria?.logic ?? "AND",
      conditions: criteria?.conditions ?? [],
      assignmentType: criteria?.assignmentType ?? "RULE",
    },
  };
}

type SegmentFormProps = {
  mode: "create" | "edit";
  segment?: Segment | null;
  serverError?: string | null;
  isSubmitting?: boolean;
  onSubmit: (values: SegmentFormSubmitValues) => Promise<void> | void;
};

export function SegmentForm({
  mode,
  segment,
  serverError,
  isSubmitting = false,
  onSubmit,
}: SegmentFormProps) {
  const router = useRouter();
  const [values, setValues] = React.useState<SegmentFormValues>(() =>
    toSegmentFormValues(segment),
  );
  const [syncedSegmentId, setSyncedSegmentId] = React.useState<string | null>(
    segment?.id ?? null,
  );
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Re-sync when a different segment is loaded (render-time adjustment, no effect)
  if (segment && segment.id !== syncedSegmentId) {
    setSyncedSegmentId(segment.id);
    setValues(toSegmentFormValues(segment));
  }

  const setField = <K extends keyof SegmentFormValues>(
    key: K,
    value: SegmentFormValues[K],
  ) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });
  };

  const handleCriteriaChange = (criteria: SegmentCriteria) => {
    setValues((previous) => ({ ...previous, criteria }));
    setErrors((previous) => {
      const next = { ...previous };
      delete next.criteria;
      delete next.conditions;
      return next;
    });
  };

  const handleAssignmentTypeChange = (value: SegmentAssignmentType | "") => {
    setValues((previous) => ({
      ...previous,
      assignmentType: value,
      criteria: {
        ...previous.criteria,
        assignmentType: value === "" ? "RULE" : value,
      },
    }));
    setErrors((previous) => {
      const next = { ...previous };
      delete next.assignmentType;
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});

    const parsed = segmentSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};

      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".");
        if (!nextErrors[path]) nextErrors[path] = issue.message;
      }

      if (nextErrors["criteria.conditions"]) {
        nextErrors.conditions = nextErrors["criteria.conditions"];
      }

      setErrors(nextErrors);
      return;
    }

    await onSubmit({
      ...values,
      name: values.name.trim(),
      description: values.description.trim() || null,
    });
  };

  const conditionErrors = values.criteria.conditions.reduce<
    Record<string, string>
  >((acc, _condition, index) => {
    const message = errors[`criteria.conditions.${index}.value`];
    if (message) acc[`conditions.${index}.value`] = message;
    return acc;
  }, {});

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {serverError ? <Notice tone="danger">{serverError}</Notice> : null}

      <Card>
        <CardHeader>
          <CardTitle>Segment information</CardTitle>
          <CardDescription>
            Name and description shown to sales users.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="segment-name">
              Segment name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="segment-name"
              value={values.name}
              placeholder="High Value Customers"
              aria-invalid={Boolean(errors.name)}
              disabled={isSubmitting}
              onChange={(event) => setField("name", event.target.value)}
            />
            {errors.name ? (
              <p className="text-sm font-medium text-red-600" role="alert">
                {errors.name}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="segment-description">Description</Label>
            <Textarea
              id="segment-description"
              value={values.description}
              placeholder="Customers with a high lead score in the technology industry"
              aria-invalid={Boolean(errors.description)}
              disabled={isSubmitting}
              onChange={(event) => setField("description", event.target.value)}
            />
            {errors.description ? (
              <p className="text-sm font-medium text-red-600" role="alert">
                {errors.description}
              </p>
            ) : null}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="segment-assignment-type">
                Assignment type <span className="text-red-500">*</span>
              </Label>
              <Select
                id="segment-assignment-type"
                value={values.assignmentType}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.assignmentType)}
                onChange={(event) =>
                  handleAssignmentTypeChange(
                    event.target.value as SegmentAssignmentType | "",
                  )
                }
              >
                <option value="">Select assignment type…</option>
                {assignmentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-gray-500">
                RULE evaluates the criteria in the backend, AI asks the model to
                decide.
              </p>
              {errors.assignmentType ? (
                <p className="text-sm font-medium text-red-600" role="alert">
                  {errors.assignmentType}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="segment-status">Status</Label>
              <Select
                id="segment-status"
                value={values.isActive ? "ACTIVE" : "INACTIVE"}
                disabled={isSubmitting}
                onChange={(event) =>
                  setField("isActive", event.target.value === "ACTIVE")
                }
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </Select>
              <p className="text-xs text-gray-500">
                Stored as <code>segments.is_active</code> in the backend.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Segmentation criteria</CardTitle>
          <CardDescription>
            Saved as the <code>criteria</code> jsonb document of the segment.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <SegmentCriteriaBuilder
            value={values.criteria}
            onChange={handleCriteriaChange}
            errors={{ ...conditionErrors, ...(errors.conditions ? { conditions: errors.conditions } : {}) }}
            disabled={isSubmitting}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/segments")}
          disabled={isSubmitting}
        >
          <X />
          Cancel
        </Button>

        <Button type="submit" disabled={isSubmitting}>
          <Save />
          {isSubmitting
            ? "Saving…"
            : mode === "create"
              ? "Create Segment"
              : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}