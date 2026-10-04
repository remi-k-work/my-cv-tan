// services, features, and other libraries
import { cn } from "@/lib/utils";

// components
import { Button } from "@base-ui/react";

// assets
import { ViewfinderCircleIcon as ViewfinderCircleIconS } from "@heroicons/react/24/solid";
import { ViewfinderCircleIcon as ViewfinderCircleIconO } from "@heroicons/react/24/outline";

// types
interface DotProps {
  selected: boolean;
  onSelect: () => void;
}

export function Dot({ selected, onSelect }: DotProps) {
  return (
    <Button className={cn("button p-2", selected && "text-accent")} onClick={onSelect}>
      {selected ? <ViewfinderCircleIconS className="size-6" /> : <ViewfinderCircleIconO className="size-6" />}
    </Button>
  );
}
