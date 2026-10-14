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
  return (
    <Button className="button group p-2" disabled={disabled} onClick={onPrev}>
      {/* The arrow drifts the way it will scroll, so hovering already answers "what does this do" */}
      <PrevIcon className="size-6 transition-transform group-hover:-translate-x-1" />
    </Button>
  );
}
