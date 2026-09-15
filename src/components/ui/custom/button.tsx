import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  cn(
    "inline-flex shrink-0 items-center justify-center gap-2 border whitespace-nowrap transition-all duration-300 ease-in-out outline-none",
    "hover:shadow-md active:scale-95 active:shadow-none",
    "focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50",
    "disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none",
    "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0"
  ),
  {
    variants: {
      variant: {
        default: "border-primary-foreground text-primary-foreground hover:shadow-primary-foreground",
        destructive: "border-destructive-foreground text-destructive-foreground hover:shadow-destructive-foreground",
        secondary: "border-secondary-foreground text-secondary-foreground hover:shadow-secondary-foreground",
        ghost: "border-primary-foreground/15 text-primary-foreground hover:shadow-primary-foreground",
      },
      size: {
        default: "px-4 py-2",
        sm: "px-3 py-1",
        lg: "px-6 py-3",
        icon: "rounded-full p-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
