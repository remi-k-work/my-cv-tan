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
    <Button className="button p-2" disabled={disabled} onClick={onNext}>
      <NextIcon className="size-6" />
    </Button>
  );
}
