import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-input w-full border px-3 py-2 transition-colors duration-300 ease-in-out outline-none",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-1",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        "placeholder:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
