// services, features, and other libraries
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { useGT } from "gt-tanstack-start";

// components
import { Button } from "@base-ui/react";

// assets
import { ViewfinderCircleIcon as ViewfinderCircleIconS } from "@heroicons/react/24/solid";
import { ViewfinderCircleIcon as ViewfinderCircleIconO } from "@heroicons/react/24/outline";

// constants
import { SPRINGS } from "@/lib/motion-tokens";

// types
interface DotProps {
  index: number;
  selected: boolean;
  onSelect: () => void;
  // Identifies this carousel's frame, so the spring stays within one slider even when several share a page
  frameLayoutId: string;
}

export function Dot({ index, selected, onSelect, frameLayoutId }: DotProps) {
  const gt = useGT();
  const label = `${gt("Go to Slide")} ${index + 1}`;

  return (
    <Button
      className={cn("button relative p-2", selected && "text-accent")}
      onClick={onSelect}
      title={label}
      aria-label={label}
      aria-current={selected ? "true" : undefined}
    >
      {/* The accent frame is handed to whichever dot is currently selected, so it springs across the row instead of blinking */}
      {selected && (
        <motion.span
          layoutId={frameLayoutId}
          className="pointer-events-none absolute inset-0 rounded-xl border border-accent"
          transition={SPRINGS.snappy}
          aria-hidden="true"
        />
      )}
      {selected ? <ViewfinderCircleIconS className="size-6" aria-hidden="true" /> : <ViewfinderCircleIconO className="size-6" aria-hidden="true" />}
    </Button>
  );
}
