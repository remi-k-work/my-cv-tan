// services, features, and other libraries
import { useGT } from "gt-tanstack-start";

// components
import { Button } from "@base-ui/react";

// assets
import { PrevIcon } from "@/assets/icons";

// types
interface PrevProps {
  disabled: boolean;
  onPrev: () => void;
}

export function Prev({ disabled, onPrev }: PrevProps) {
  const gt = useGT();
  const label = gt("Previous Slide");

  return (
    <Button className="button group p-2" disabled={disabled} title={label} aria-label={label} onClick={onPrev}>
      {/* The arrow drifts the way it will scroll, so hovering already answers "what does this do" */}
      <PrevIcon className="size-6 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
    </Button>
  );
}
