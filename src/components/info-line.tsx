// oxlint-disable jsx-a11y/prefer-tag-over-role

// services, features, and other libraries
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";

// assets
import { InformationCircleIcon } from "@heroicons/react/24/solid";

// types
interface InfoLineProps {
  message?: string;
  className?: string;
}

export function InfoLine({ message, className }: InfoLineProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          role="status"
          aria-live="polite"
          className={cn("flex max-w-none items-center gap-2 border px-3 py-2 text-muted-foreground", className)}
          layout
          initial={{ opacity: 0, scale: 0, height: 0 }}
          animate={{ opacity: 1, scale: 1, height: "auto" }}
          exit={{ opacity: 0, scale: 0, height: 0 }}
          transition={{ default: { type: "spring", visualDuration: 1, bounce: 0.5 }, opacity: { ease: "easeOut" }, height: { ease: "easeOut" } }}
        >
          <InformationCircleIcon className="size-9 flex-none" />
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
