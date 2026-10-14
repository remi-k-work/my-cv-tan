// services, features, and other libraries
import { cn } from "@/lib/utils";

// types
import type { ReactNode } from "react";

interface LinkChipProps {
  href: string;
  title: string;
  children: ReactNode;
}

// Round icon chip linking to an external page in a new tab
export function LinkChip({ href, title, children }: LinkChipProps) {
  return (
    <a
      className={cn(
        "rounded-full border border-text-1 p-1",
        "hover:scale-110 hover:border-accent hover:text-accent",
        // Same neon halo the reveal light bar casts, so the chips belong to the same light language
        "hover:shadow-[0_0_6px_var(--accent),0_0_12px_var(--accent)]",
        // Press feedback mirroring the .button utilities
        "active:scale-95 active:shadow-none"
      )}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
    >
      {children}
    </a>
  );
}
