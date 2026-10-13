// services, features, and other libraries
import { cn } from "@/lib/utils";

// types
import type { ReactNode } from "react";

interface LinkChipProps {
  href: string;
  title: string;
  children: ReactNode;
}

// Round icon chip linking out; pops toward the viewer in 3D on hover via the perspective() baked into the transform, so it works at any nesting depth
export function LinkChip({ href, title, children }: LinkChipProps) {
  return (
    <a
      className={cn("rounded-full border border-text-1 p-1", "hover:scale-110 hover:border-accent hover:text-accent")}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
    >
      {children}
    </a>
  );
}
