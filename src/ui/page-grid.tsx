// services, features, and other libraries
import { cn } from "@/lib/utils";

// types
import type { ReactNode } from "react";

// The two-column page grid shared by multi-panel pages; extra classes (e.g. auto-rows-fr) can be merged in
export function PageGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid animate-rise grid-cols-1 gap-4 [animation-delay:0.5s] xl:grid-cols-2", className)}>{children}</div>;
}
