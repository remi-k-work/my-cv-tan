// services, features, and other libraries
import { useGT } from "gt-tanstack-start";

// components
import { Button } from "@base-ui/react";

// assets
import { NextIcon } from "@/assets/icons/next";

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
      {/* The wrapper carries the drift: CSS transforms aren't hardware-accelerated on SVG elements, but are on the HTML wrapper */}
      <span className="inline-flex transition-transform group-hover:translate-x-1">
        <NextIcon className="size-6" aria-hidden="true" />
      </span>
    </Button>
  );
}
