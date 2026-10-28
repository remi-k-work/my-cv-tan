// services, features, and other libraries
import { useGT } from "gt-tanstack-start";

// components
import { SlideButton } from "./slide-button";

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
    <SlideButton
      disabled={disabled}
      onClick={onPrev}
      label={label}
      icon={<PrevIcon className="size-6" aria-hidden="true" />}
      hoverTranslate="group-hover:-translate-x-1"
    />
  );
}
