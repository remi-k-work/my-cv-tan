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
    <Button className="button p-2" disabled={disabled} onClick={onPrev}>
      <PrevIcon className="size-6" />
    </Button>
  );
}
