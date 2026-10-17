// types
import type { ComponentPropsWithoutRef } from "react";

export function NextIcon({ className, ...rest }: ComponentPropsWithoutRef<"svg">) {
  return (
    <svg viewBox="0 0 532 532" className={className} aria-hidden="true" {...rest}>
      <path
        fill="currentColor"
        d="M176.3 520.6c-13.8 13.8-36.2 13.8-50 0-13.8-13.8-13.8-36.2 0-50L330.8 266 126.3 61.4c-13.8-13.8-13.8-36.2 0-50 13.8-13.8 36.2-13.8 50 0 22.9 22.9 206.4 206.5 229.3 229.5a35.1 35.1 0 0 1 10.3 25.1c0 9.2-3.4 18.3-10.3 25.2-45.9 45.9-206.4 206.6-229.3 229.5Z"
      />
    </svg>
  );
}
