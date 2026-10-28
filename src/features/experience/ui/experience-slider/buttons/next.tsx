// services, features, and other libraries
import { useGT } from "gt-tanstack-start";

// components
import { SlideButton } from "./slide-button";

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
    <SlideButton
      disabled={disabled}
      onClick={onNext}
      label={label}
      icon={<NextIcon className="size-6" aria-hidden="true" />}
      hoverTranslate="group-hover:translate-x-1"
    />
  );
}
