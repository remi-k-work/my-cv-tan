// services, features, and other libraries
import { motion } from "motion/react";

// assets
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

// types
interface ErrorLineProps {
  message: string;
}

export function ErrorLine({ message }: ErrorLineProps) {
  return (
    <motion.p
      role="alert"
      className="flex max-w-none items-center gap-2 overflow-clip rounded-b-xl border border-destructive-foreground px-3 py-2 text-destructive-foreground"
      layout
      initial={{ opacity: 0, y: "-50%", height: 0 }}
      animate={{ opacity: 1, y: "0%", height: "auto" }}
      exit={{ opacity: 0, y: "-50%", height: 0 }}
      transition={{ default: { type: "spring", visualDuration: 1, bounce: 0.5 }, opacity: { ease: "easeOut" }, height: { ease: "easeOut" } }}
    >
      <ExclamationTriangleIcon className="size-9 flex-none" />
      {message}
    </motion.p>
  );
}
