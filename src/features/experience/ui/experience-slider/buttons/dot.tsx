// services, features, and other libraries
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

// components
import { Button } from "@base-ui/react";

// assets
import { ViewfinderCircleIcon as ViewfinderCircleIconS } from "@heroicons/react/24/solid";
import { ViewfinderCircleIcon as ViewfinderCircleIconO } from "@heroicons/react/24/outline";

// constants
import { SPRINGS } from "@/lib/motion-tokens";

// types
interface DotProps {
  selected: boolean;
  onSelect: () => void;
  // Identifies this carousel's frame, so the spring stays within one slider even when several share a page
  frameLayoutId: string;
}

export function Dot({ selected, onSelect, frameLayoutId }: DotProps) {
  return (
    <Button className={cn("button relative p-2", selected && "text-accent")} onClick={onSelect}>
      {/* The accent frame is handed to whichever dot is currently selected, so it springs across the row instead of blinking */}
      {selected && (
        <motion.span
          aria-hidden
          layoutId={frameLayoutId}
          className="pointer-events-none absolute inset-0 rounded-xl border border-accent"
          transition={SPRINGS.snappy}
        />
      )}
      {selected ? <ViewfinderCircleIconS className="size-6" /> : <ViewfinderCircleIconO className="size-6" />}
    </Button>
  );
}
