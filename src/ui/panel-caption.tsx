// types
import type { ReactNode } from "react";

interface PanelCaptionProps {
  children: ReactNode;
  id?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

// The uppercase heading chip that titles a content panel
export function PanelCaption({ children, id, level = 2 }: PanelCaptionProps) {
  const Heading = `h${level}` as const;

  return (
    <Heading id={id} className="mb-4 place-self-end rounded-ss-xl rounded-ee-xl bg-surface-1 p-3 tracking-widest text-text-2 uppercase select-none">
      {children}
    </Heading>
  );
}
