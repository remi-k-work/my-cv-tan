// oxlint-disable jsx-a11y/prefer-tag-over-role

// services, features, and other libraries
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";

// assets
import InformationCircleIcon from "@heroicons/react/24/solid/InformationCircleIcon";

// types
interface InfoLineProps {
  message?: string;
  className?: string;
}

// constants
import { MOTION_TOKENS, SPRINGS } from "@/lib/motion-tokens";

export function InfoLine({ message, className }: InfoLineProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          role="status"
          className={cn("my-3 flex max-w-none items-center justify-center gap-2 border border-destructive px-3 py-2 text-destructive", className)}
          layout
          initial={{ opacity: 0, scale: MOTION_TOKENS.scale.press, y: MOTION_TOKENS.distance.sm }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: MOTION_TOKENS.scale.press, y: MOTION_TOKENS.distance.sm }}
          transition={SPRINGS.gentle}
        >
          <InformationCircleIcon className="size-9 flex-none" aria-hidden="true" />
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
