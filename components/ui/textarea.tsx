import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full rounded-xl border border-[#e2e8e4] bg-white px-3 py-2 text-sm text-[#17221c] shadow-sm outline-none transition placeholder:text-gray-400 focus-visible:border-[#173b2b] focus-visible:ring-2 focus-visible:ring-[#173b2b]/15 disabled:cursor-not-allowed disabled:bg-[#f6f8f7] disabled:opacity-60 aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/20",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };