// services, features, and other libraries
import { useGT } from "gt-tanstack-start";

// components
import { Button } from "@base-ui/react";

// assets
import { NextIcon } from "@/assets/icons";

// types
interface NextProps {
  disabled: boolean;
  onNext: () => void;
}

export function Next({ disabled, onNext }: NextProps) {
  const gt = useGT();
  const label = gt("Next Slide");

  return (
    <Button className="button group p-2" disabled={disabled} title={label} aria-label={label} onClick={onNext}>
      {/* The arrow drifts the way it will scroll, so hovering already answers "what does this do" */}
      <NextIcon className="size-6 transition-transform group-hover:translate-x-1" aria-hidden="true" />
    </Button>
  );
}
