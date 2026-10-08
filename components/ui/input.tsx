import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-xl border border-[#e2e8e4] bg-white px-3 py-2 text-sm text-[#17221c] shadow-sm outline-none transition placeholder:text-gray-400 focus-visible:border-[#173b2b] focus-visible:ring-2 focus-visible:ring-[#173b2b]/15 disabled:cursor-not-allowed disabled:bg-[#f6f8f7] disabled:opacity-60 aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/20",
        className,
      )}
      {...props}
    />
  );
}

export { Input };