export type DelayUnit = "minutes" | "hours" | "days";

export function valueAndUnitToMinutes(value: number, unit: DelayUnit): number {
  const val = Math.max(0, Math.floor(value || 0));
  switch (unit) {
    case "minutes":
      return val;
    case "hours":
      return val * 60;
    case "days":
      return val * 1440;
    default:
      return val;
  }
}

export function minutesToValueAndUnit(minutes: number): {
  value: number;
  unit: DelayUnit;
} {
  const mins = Math.max(0, Math.floor(minutes || 0));
  if (mins === 0) {
    return { value: 0, unit: "minutes" };
  }
  if (mins % 1440 === 0) {
    return { value: mins / 1440, unit: "days" };
  }
  if (mins % 60 === 0) {
    return { value: mins / 60, unit: "hours" };
  }
  return { value: mins, unit: "minutes" };
}

export function formatDelayDescription(minutes: number, stepOrder: number): string {
  const mins = Math.max(0, Math.floor(minutes || 0));
  if (mins === 0) {
    return stepOrder === 1
      ? "Immediately upon enrollment"
      : "Immediately after previous step";
  }

  const { value, unit } = minutesToValueAndUnit(mins);
  const unitLabel =
    value === 1 ? unit.slice(0, -1) : unit; // "hour" vs "hours"

  if (stepOrder === 1) {
    return `Send ${value} ${unitLabel} after enrollment`;
  }
  return `Send ${value} ${unitLabel} after previous step`;
}
