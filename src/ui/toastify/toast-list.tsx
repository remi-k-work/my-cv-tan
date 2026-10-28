// services, features, and other libraries
import { cn } from "@/lib/utils";
import { useGT } from "gt-tanstack-start";

// components
import { Toast } from "@base-ui/react";

// assets
import CheckCircleIcon from "@heroicons/react/24/solid/CheckCircleIcon";
import ExclamationTriangleIcon from "@heroicons/react/24/solid/ExclamationTriangleIcon";
import XCircleIcon from "@heroicons/react/24/solid/XCircleIcon";

// types
import type { ToastObject } from "@base-ui/react";

// constants
// Toast root CSS variables, positioning, and base layout — identical on every toast
const TOAST_ROOT_BASE = cn(
  "[--gap:0.75rem] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)*-1+calc(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-movement-y))] [--peek:0.75rem] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))]",
  "absolute right-0 bottom-0 left-auto z-[calc(1000-var(--toast-index))] mr-0 h-(--height) w-full border bg-surface-1 shadow-sm select-none",
  "transition duration-300 ease-in-out",
  "origin-bottom",
  "transform-[translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-(var(--toast-index)*var(--peek))-(var(--shrink)*var(--height))))_scale(var(--scale))]",
  "after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-['']"
);

// Toast root conditional variants driven by data attributes (error type, expanded state,
// swipe direction, limited visibility). Kept separate from the base so the JSX structure
// stays scannable and each variant group is easy to locate
const TOAST_ROOT_VARIANTS = cn(
  "data-[type=error]:border-destructive data-[type=error]:text-destructive",
  "data-starting-style:transform-[translateY(150%)]",
  "data-ending-style:opacity-0",
  "data-ending-style:data-[swipe-direction=down]:transform-[translateY(calc(var(--toast-swipe-movement-y)+150%))]",
  "data-ending-style:data-[swipe-direction=left]:transform-[translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]",
  "data-ending-style:data-[swipe-direction=right]:transform-[translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
  "data-ending-style:data-[swipe-direction=up]:transform-[translateY(calc(var(--toast-swipe-movement-y)-150%))]",
  "data-expanded:h-(--toast-height) data-expanded:transform-[translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--offset-y)))]",
  "data-expanded:data-ending-style:data-[swipe-direction=down]:transform-[translateY(calc(var(--toast-swipe-movement-y)+150%))]",
  "data-expanded:data-ending-style:data-[swipe-direction=left]:transform-[translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]",
  "data-expanded:data-ending-style:data-[swipe-direction=right]:transform-[translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
  "data-expanded:data-ending-style:data-[swipe-direction=up]:transform-[translateY(calc(var(--toast-swipe-movement-y)-150%))]",
  "data-limited:opacity-0",
  "[&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:transform-[translateY(150%)]"
);

// Toast content flex layout and transitions
const TOAST_CONTENT_BASE = cn(
  "flex h-full items-center gap-4 overflow-clip p-3",
  "transition-opacity duration-300 ease-in-out",
  "data-behind:opacity-0 data-expanded:opacity-100"
);

// One toast notification: its icon, title, description, and close button, plus the
// entrance/exit transform stack shared by every toast in the viewport; extracted from
// ToastList so the list itself stays a simple map and each toast is a single, named unit
function ToastItem({ toast }: { toast: ToastObject<any> }) {
  const gt = useGT();

  return (
    <Toast.Root key={toast.id} toast={toast} className={cn(TOAST_ROOT_BASE, TOAST_ROOT_VARIANTS)}>
      <Toast.Content className={TOAST_CONTENT_BASE}>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2">
            {toast.type === "error" ? (
              <ExclamationTriangleIcon className="size-11" aria-hidden="true" />
            ) : (
              <CheckCircleIcon className="size-11" aria-hidden="true" />
            )}
            <Toast.Title className="text-lg font-semibold tracking-widest text-text-2 uppercase data-[type=error]:text-destructive sm:text-xl" />
          </div>
          <Toast.Description className="text-text-1" />
        </div>
        <Toast.Close className="button bg-secondary p-1 text-text-1" aria-label={gt("Close")}>
          <XCircleIcon className="size-11" aria-hidden="true" />
        </Toast.Close>
      </Toast.Content>
    </Toast.Root>
  );
}

export function ToastList() {
  const { toasts } = Toast.useToastManager();

  return toasts.map((toast) => <ToastItem key={toast.id} toast={toast} />);
}
