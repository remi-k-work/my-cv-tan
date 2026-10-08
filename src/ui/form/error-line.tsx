// services, features, and other libraries
import { motion } from "motion/react";
import { useGT } from "gt-tanstack-start";

// assets
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";

// types
interface ErrorLineProps {
  message: string;
}

// constants
import { SPRINGS } from "@/lib/motion-tokens";

export function ErrorLine({ message }: ErrorLineProps) {
  const gt = useGT();

  return (
    <motion.p
      role="alert"
      className="flex max-w-none items-center gap-2 overflow-clip rounded-b-xl border border-destructive px-3 py-2 text-destructive"
      layout
      initial={{ opacity: 0, y: "-25%", height: 0 }}
      animate={{ opacity: 1, y: "0%", height: "auto" }}
      exit={{ opacity: 0, y: "-25%", height: 0 }}
      transition={SPRINGS.gentle}
    >
      <ExclamationTriangleIcon className="size-9 flex-none" />
      {gt(message)}
    </motion.p>
  );
}
