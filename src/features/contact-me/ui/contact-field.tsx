// types
import type { ReactNode } from "react";

// One contact form field with consistent vertical spacing, replacing the <br /> elements
// that were previously used as presentational layout spacers between fields
export function ContactField({ children }: { children: ReactNode }) {
  return <div className="mb-4">{children}</div>;
}
