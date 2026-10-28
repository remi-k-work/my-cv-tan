// types
import type { ReactNode } from "react";

// A content panel shared by multi-panel pages: rounded surface with consistent padding
export function PagePanel({ children }: { children: ReactNode }) {
  return <div className="rounded-xl bg-surface-2 p-4">{children}</div>;
}
