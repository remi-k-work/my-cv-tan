// types
import type { ReactNode } from "react";

interface PanelCaptionProps {
  children: ReactNode;
}

// The uppercase caption chip that titles a content panel
export function PanelCaption({ children }: PanelCaptionProps) {
  return (
    <figcaption className="mb-4 place-self-end rounded-ss-xl rounded-ee-xl bg-surface-1 p-3 tracking-widest text-text-2 uppercase select-none">
      {children}
    </figcaption>
  );
}
