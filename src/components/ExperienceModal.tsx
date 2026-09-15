// react
import { useEffect, useRef } from "react";

// tanstack
import { useRouter } from "@tanstack/react-router";

// services, features, and other libraries
import { cn } from "@/lib/utils";

// components
import { Button } from "@base-ui/react";

// assets
import { InformationCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";

// types
import type { ReactNode } from "react";
import type { LocalizedContent } from "@/types/shared";

interface ExperienceModalProps {
  localizedContent: LocalizedContent;
  children: ReactNode;
}

// constants
const CLOSE_DURATION = 1000;

export default function ExperienceModal({ localizedContent, children }: ExperienceModalProps) {
  // To be able to call showModal() method on the dialog
  const dialogRef = useRef<HTMLDialogElement>(null);

  // To be able to close the modal
  const router = useRouter();

  // Create a ref to hold the timeout id
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Show the dialog as a modal
    dialogRef.current?.showModal();

    // The cleanup function runs when the component unmounts
    return () => {
      // If a timeout is scheduled, clear it
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    };
  }, []);

  function handleClosed() {
    // Wait for animation to complete before navigating back
    timeoutIdRef.current = setTimeout(() => router.history.back(), CLOSE_DURATION);
  }

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        "@container",
        "fixed inset-0 z-50 grid size-full max-h-none max-w-none place-items-center overflow-hidden overscroll-contain bg-transparent text-foreground transition-all transition-discrete duration-1000 ease-in-out",
        "not-open:pointer-events-none not-open:invisible not-open:opacity-0 open:pointer-events-auto open:visible open:opacity-100 focus-visible:outline-none",
        "backdrop:backdrop-blur-xl backdrop:[transition:backdrop-filter_1s_ease]"
      )}
      onClose={handleClosed}
    >
      <form
        method="dialog"
        className="grid max-h-[min(95dvb,100%)] max-w-[min(96ch,100%)] grid-rows-[auto_1fr] items-start overflow-hidden rounded-xl bg-background"
      >
        <header className="flex items-center justify-between gap-4 p-1">
          <section className="flex items-center gap-2">
            <InformationCircleIcon className="size-11 flex-none text-secondary-foreground" />
            <h3 className="inline-grid flex-1 overflow-clip text-xl tracking-widest text-secondary-foreground uppercase">
              <span className="col-span-full row-span-full animate-reveal-text [clip-path:inset(0_100%_0_0)]">
                {localizedContent["experienceModal"]["projectInfo"]}
              </span>
              <span
                className={cn(
                  "col-span-full row-span-full flex animate-sweep-light-bar",
                  "before:h-full before:w-2 before:flex-none before:rounded-lg before:bg-accent-foreground before:shadow-[0_0_6px_#DFFF00,0_0_12px_#DFFF00] before:content-['']",
                  "after:-z-1 after:flex-1 after:bg-background after:content-['']"
                )}
              />
            </h3>
          </section>
          <Button className="button" type="submit">
            <XCircleIcon className="size-9" />
          </Button>
        </header>
        <article className="z-1 grid max-h-full overflow-y-auto overscroll-y-contain">{children}</article>
      </form>
    </dialog>
  );
}
