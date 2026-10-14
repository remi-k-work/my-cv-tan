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
  return (
    <Button className="button group p-2" disabled={disabled} onClick={onNext}>
      {/* The arrow drifts the way it will scroll, so hovering already answers "what does this do" */}
      <NextIcon className="size-6 transition-transform group-hover:translate-x-1" />
    </Button>
  );
}
