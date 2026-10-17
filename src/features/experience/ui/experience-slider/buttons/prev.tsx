// services, features, and other libraries
import { useGT } from "gt-tanstack-start";

// components
import { Button } from "@base-ui/react";

// assets
import { PrevIcon } from "@/assets/icons/prev";

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
      {/* The wrapper carries the drift: CSS transforms aren't hardware-accelerated on SVG elements, but are on the HTML wrapper */}
      <span className="inline-flex transition-transform group-hover:-translate-x-1">
        <PrevIcon className="size-6" aria-hidden="true" />
      </span>
    </Button>
  );
}
