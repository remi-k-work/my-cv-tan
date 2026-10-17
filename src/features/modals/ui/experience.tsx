// services, features, and other libraries
import { cn } from "@/lib/utils";
import { useGT } from "gt-tanstack-start";

// components
import { Button, Dialog } from "@base-ui/react";
import { RevealText } from "@/ui/reveal-text";

// assets
import InformationCircleIcon from "@heroicons/react/24/solid/InformationCircleIcon";
import XCircleIcon from "@heroicons/react/24/solid/XCircleIcon";

// types
import type { ReactNode } from "react";

interface ExperienceModalProps {
  isOpen: boolean;
  onClosed: () => void;
  title: string;
  children: ReactNode;
}

// Pure presentation shell of the overlay: the parent decides when it is open and what closing means
export function ExperienceModal({ isOpen, onClosed, title, children }: ExperienceModalProps) {
  const gt = useGT();

  return (
    <Dialog.Root open={isOpen} onOpenChange={(next) => !next && onClosed()}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 bg-black opacity-75",
            "transition-opacity duration-300 ease-in-out",
            "data-ending-style:opacity-0 data-starting-style:opacity-0",
            "supports-[-webkit-touch-callout:none]:absolute"
          )}
        />
        <Dialog.Viewport className="fixed inset-0 flex items-center justify-center overflow-clip perspective-distant">
          <Dialog.Popup
            className={cn(
              "relative max-h-[90dvh] w-[90dvw] max-w-5xl overflow-x-clip overflow-y-auto bg-surface-1 p-1 text-text-1",
              "transition duration-300 ease-in-out",
              "data-ending-style:scale-90 data-ending-style:transform-[rotateX(6deg)] data-ending-style:opacity-0",
              "data-starting-style:scale-90 data-starting-style:transform-[rotateX(6deg)] data-starting-style:opacity-0"
            )}
          >
            <header className="mb-6 flex items-center justify-between gap-4 bg-surface-2 p-1">
              <div className="flex items-center gap-2 text-text-2">
                <InformationCircleIcon className="size-11 flex-none" aria-hidden="true" />
                {/* Dialog.Title registers the heading as the popup's accessible name, so the dialog is announced with it */}
                <Dialog.Title
                  render={
                    <h2 className="inline-grid flex-1 overflow-clip text-xl tracking-widest uppercase">
                      <RevealText>{title}</RevealText>
                    </h2>
                  }
                />
              </div>
              <Button className="button" title={gt("Close")} aria-label={gt("Close")} onClick={onClosed}>
                <XCircleIcon className="size-9" aria-hidden="true" />
              </Button>
            </header>
            {children}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
