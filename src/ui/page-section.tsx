// react
import { useId } from "react";

// components
import { PanelCaption } from "@/ui/panel-caption";

// types
import type { ReactNode } from "react";

// A titled content section: a max-width panel topped with a caption heading
// Education and Certificates shared this exact section skeleton, so it lives here in one place
export function PageSection({ title, children }: { title: ReactNode; children: ReactNode }) {
  const headingId = useId();

  return (
    <section className="mx-auto w-full max-w-4xl" aria-labelledby={headingId}>
      <PanelCaption id={headingId}>{title}</PanelCaption>
      {children}
    </section>
  );
}
