import * as React from "react";

import { cn } from "@/lib/utils";

function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "flex h-10 w-full min-w-0 appearance-none rounded-xl border border-[#e2e8e4] bg-white px-3 py-2 text-sm text-[#17221c] shadow-sm outline-none transition focus-visible:border-[#173b2b] focus-visible:ring-2 focus-visible:ring-[#173b2b]/15 disabled:cursor-not-allowed disabled:bg-[#f6f8f7] disabled:opacity-60 aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/20",
        className,
      )}
      {...props}
    />
  );
}

export { Select };