// types
import type { ComponentPropsWithoutRef } from "react";

export function PrevIcon({ className, ...rest }: ComponentPropsWithoutRef<"svg">) {
  return (
    <svg viewBox="0 0 532 532" className={className} aria-hidden="true" {...rest}>
      <path
        fill="currentColor"
        d="M355.7 11.4c13.8-13.8 36.2-13.8 50 0 13.8 13.8 13.8 36.2 0 50L201.2 266l204.4 204.6c13.8 13.8 13.8 36.2 0 50-13.8 13.8-36.2 13.8-50 0a5994246.3 5994246.3 0 0 0-229.3-229.5 35.1 35.1 0 0 1-10.3-25.1c0-9.2 3.4-18.3 10.3-25.2C172.2 195 332.7 34.3 355.7 11.4Z"
      />
    </svg>
  );
}
