// types
import type { ComponentPropsWithoutRef } from "react";

export default function PlFlagIcon({ className }: ComponentPropsWithoutRef<"svg">) {
  return (
    <svg viewBox="0 0 512 512" className={className}>
      <g fillRule="evenodd">
        <path fill="#fff" d="M512 512H0V0h512z" />
        <path fill="#dc143c" d="M512 512H0V256h512z" />
      </g>
    </svg>
  );
}
