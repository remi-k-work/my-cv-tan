// services, features, and other libraries
import { cn } from "@/lib/utils";

// types
import type { ReactNode } from "react";

interface RevealTextProps {
  reverse?: boolean;
  children: ReactNode;
}

// constants
// The class sets are fully static, so they are merged once at module scope
// instead of re-running tailwind-merge on every render
const TEXT_CLASSES = cn("col-span-full row-span-full animate-reveal-text", "[clip-path:inset(0_100%_0_0)]");
const TEXT_CLASSES_REVERSED = cn("col-span-full row-span-full animate-reveal-text", "[clip-path:inset(0_0_0_100%)]");
const SWEEP_CLASSES = cn(
  "col-span-full row-span-full flex animate-sweep-light-bar",
  "before:h-full before:w-2 before:flex-none before:rounded-lg before:bg-accent before:shadow-[0_0_6px_#DFFF00,0_0_12px_#DFFF00] before:content-['']",
  "after:-z-1 after:flex-1 after:bg-surface-2 after:content-['']"
);
const SWEEP_CLASSES_REVERSED = cn(
  "col-span-full row-span-full flex animate-sweep-light-bar-r",
  "after:h-full after:w-2 after:flex-none after:rounded-lg after:bg-accent after:shadow-[0_0_6px_#DFFF00,0_0_12px_#DFFF00] after:content-['']",
  "before:-z-1 before:flex-1 before:bg-surface-2 before:content-['']"
);

// Text revealed by a light bar sweeping across it; must sit inside a grid parent; `reverse` sweeps in the opposite direction
export function RevealText({ reverse = false, children }: RevealTextProps) {
  return (
    <>
      <span className={reverse ? TEXT_CLASSES_REVERSED : TEXT_CLASSES}>{children}</span>
      <span className={reverse ? SWEEP_CLASSES_REVERSED : SWEEP_CLASSES} aria-hidden="true" />
    </>
  );
}
