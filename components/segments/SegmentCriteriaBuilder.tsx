import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  SEGMENT_CRITERIA_FIELDS,
  SEGMENT_OPERATORS,
  type SegmentCriteria,
  type SegmentCriterion,
} from "@/types/segment";

type SegmentCriteriaBuilderProps = {
  value: SegmentCriteria;
  onChange: (value: SegmentCriteria) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
};

function getFieldMeta(field: string) {
  return SEGMENT_CRITERIA_FIELDS.find((item) => item.value === field);
}

/**
 * Builds the jsonb criteria document of a segment:
 * `{ logic, conditions: [{ field, operator, value }], assignmentType }`.
 */
export function SegmentCriteriaBuilder({
  value,
  onChange,
  errors = {},
  disabled = false,
}: SegmentCriteriaBuilderProps) {
  const updateCondition = (index: number, patch: Partial<SegmentCriterion>) => {
    const conditions = value.conditions.map((condition, position) =>
      position === index ? { ...condition, ...patch } : condition,
    );
    onChange({ ...value, conditions });
  };

  const addCondition = () => {
    const [firstField] = SEGMENT_CRITERIA_FIELDS;

    onChange({
      ...value,
      conditions: [
        ...value.conditions,
        {
          id: `${Date.now()}-${value.conditions.length}`,
          field: firstField?.value ?? "score",
          operator: "greater_than_or_equal",
          value: "",
        },
      ],
    });
  };

  const removeCondition = (index: number) => {
    onChange({
      ...value,
      conditions: value.conditions.filter((_, position) => position !== index),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#17221c]">
            Combine conditions with
          </span>
          <Select
            aria-label="Criteria logic"
            className="w-28"
            value={value.logic}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                ...value,
                logic: event.target.value as SegmentCriteria["logic"],
              })
            }
          >
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </Select>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCondition}
          disabled={disabled}
        >
          <Plus />
          Add condition
        </Button>
      </div>

      {errors.conditions ? (
        <p className="text-sm font-medium text-red-600" role="alert">
          {errors.conditions}
        </p>
      ) : null}

      {value.conditions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#d7e4db] bg-[#f6f8f7] px-4 py-6 text-center text-sm text-gray-500">
          No condition yet. Add at least one condition to describe this
          segment.
        </div>
      ) : (
        <ul className="space-y-3">
          {value.conditions.map((condition, index) => {
            const fieldMeta = getFieldMeta(condition.field);
            const valueType = fieldMeta?.type ?? "string";

            return (
              <li
                key={condition.id}
                className="rounded-xl border border-[#e2e8e4] bg-[#f6f8f7] p-3"
              >
                <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto]">
                  <div className="space-y-1">
                    <label
                      htmlFor={`criteria-field-${condition.id}`}
                      className="text-xs font-semibold text-gray-500"
                    >
                      Field
                    </label>
                    <Select
                      id={`criteria-field-${condition.id}`}
                      value={condition.field}
                      disabled={disabled}
                      onChange={(event) =>
                        updateCondition(index, {
                          field: event.target.value,
                        })
                      }
                    >
                      {SEGMENT_CRITERIA_FIELDS.map((field) => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor={`criteria-operator-${condition.id}`}
                      className="text-xs font-semibold text-gray-500"
                    >
                      Operator
                    </label>
                    <Select
                      id={`criteria-operator-${condition.id}`}
                      className="sm:w-44"
                      value={condition.operator}
                      disabled={disabled}
                      onChange={(event) =>
                        updateCondition(index, {
                          operator: event.target
                            .value as SegmentCriterion["operator"],
                        })
                      }
                    >
                      {SEGMENT_OPERATORS.map((operator) => (
                        <option key={operator.value} value={operator.value}>
                          {operator.symbols[valueType]} · {operator.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor={`criteria-value-${condition.id}`}
                      className="text-xs font-semibold text-gray-500"
                    >
                      Value
                    </label>
                    <Input
                      id={`criteria-value-${condition.id}`}
                      type={valueType === "number" ? "number" : "text"}
                      placeholder={
                        fieldMeta?.type === "number" ? "70" : "Technology"
                      }
                      value={condition.value}
                      disabled={disabled}
                      aria-invalid={
                        Boolean(errors[`conditions.${index}.value`])
                      }
                      onChange={(event) =>
                        updateCondition(index, { value: event.target.value })
                      }
                    />
                    {fieldMeta?.hint ? (
                      <p className="text-xs text-gray-400">
                        {fieldMeta.hint}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove condition ${index + 1}`}
                      disabled={disabled}
                      onClick={() => removeCondition(index)}
                    >
                      <Trash2 className="text-red-500" />
                    </Button>
                  </div>
                </div>

                {errors[`conditions.${index}.value`] ? (
                  <p className="mt-2 text-xs font-medium text-red-600">
                    {errors[`conditions.${index}.value`]}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <div className="rounded-xl bg-[#f2f7f3] px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Preview
        </p>
        <p className="mt-1 text-sm text-[#17221c]">
          {value.conditions.length === 0
            ? "No criteria defined yet."
            : value.conditions
                .map((condition) => {
                  const meta = getFieldMeta(condition.field);
                  const operator =
                    SEGMENT_OPERATORS.find(
                      (item) => item.value === condition.operator,
                    )?.symbols[meta?.type ?? "string"] ?? condition.operator;

                  return `${meta?.label ?? condition.field} ${operator} ${condition.value || "…"}`;
                })
                .join(` ${value.logic} `)}
        </p>
      </div>
    </div>
  );
}