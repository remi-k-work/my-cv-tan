// services, features, and other libraries
import { cn } from "@/lib/utils";

// assets
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";

// types
interface ErrorLineProps {
  isShowing: boolean;
  message: string;
}

export function ErrorLine({ isShowing, message }: ErrorLineProps) {
  return (
    <p
      role="alert"
      className={cn(
        "flex max-w-none items-center gap-2 rounded-b-xl border border-destructive-foreground px-3 py-2 text-destructive-foreground",
        isShowing ? "animate-valid-error-show" : "animate-valid-error-hide"
      )}
    >
      <ExclamationTriangleIcon className="size-9 flex-none" />
      {message}
    </p>
  );
}
