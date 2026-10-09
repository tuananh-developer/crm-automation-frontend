"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { ReviewInbox } from "@/components/review/ReviewInbox";

function ReviewInboxFromUrl() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = searchParams.get("task");

  const handleTaskIdChange = React.useCallback(
    (nextTaskId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (nextTaskId) {
        params.set("task", nextTaskId);
      } else {
        params.delete("task");
      }

      const query = params.toString();
      router.replace(query ? `/review?${query}` : "/review", { scroll: false });
    },
    [router, searchParams],
  );

  return <ReviewInbox taskId={taskId} onTaskIdChange={handleTaskIdChange} />;
}

export default function ReviewPage() {
  return (
    <React.Suspense
      fallback={
        <div
          className="flex items-center justify-center gap-3 py-16 text-sm text-gray-500"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="size-5 animate-spin text-[#173b2b]" />
          Đang tải Review Center…
        </div>
      }
    >
      <ReviewInboxFromUrl />
    </React.Suspense>
  );
}
