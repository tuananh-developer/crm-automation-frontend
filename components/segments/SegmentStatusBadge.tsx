import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { SegmentStatus } from "@/types/segment";

/** Maps `segments.is_active` to the ACTIVE / INACTIVE status badge. */
export function SegmentStatusBadge({
  isActive,
  className,
}: {
  isActive: boolean;
  className?: string;
}) {
  const status: SegmentStatus = isActive ? "ACTIVE" : "INACTIVE";
  const tone: BadgeTone = isActive ? "success" : "neutral";

  return (
    <Badge tone={tone} className={className}>
      <span
        className={`size-1.5 rounded-full ${
          isActive ? "bg-emerald-500" : "bg-gray-400"
        }`}
      />
      {status}
    </Badge>
  );
}