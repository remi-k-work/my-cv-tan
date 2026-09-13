// other libraries
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
        "text-destructive-foreground border-destructive-foreground flex max-w-none items-center gap-2 rounded-b-xl border px-3 py-2",
        isShowing ? "animate-valid-error-show" : "animate-valid-error-hide",
      )}
    >
      <ExclamationTriangleIcon className="size-9 flex-none" />
      {message}
    </p>
  );
}
