// services, features, and other libraries
import { cn } from "@/lib/utils";

// components
import { Button } from "@base-ui/react";

// types
import type { ReactNode } from "react";

// A carousel navigation button: the same interactive shell for previous/next,
// differing only in the icon, the hover translate direction, and the accessible label
interface SlideButtonProps {
  disabled: boolean;
  onClick: () => void;
  label: string;
  icon: ReactNode;
  hoverTranslate: string;
}

export function SlideButton({ disabled, onClick, label, icon, hoverTranslate }: SlideButtonProps) {
  return (
    <Button className="button group p-2" disabled={disabled} title={label} aria-label={label} onClick={onClick}>
      <span className={cn("inline-flex transition-transform", hoverTranslate)} aria-hidden="true">
        {icon}
      </span>
    </Button>
  );
}
