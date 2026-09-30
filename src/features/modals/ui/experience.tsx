// services, features, and other libraries
import { cn } from "@/lib/utils";
import { Option } from "effect";
import { useAtom } from "@effect/atom-react";
import { experienceAtom } from "@/features/modals/state";

// components
import { Button, Dialog } from "@base-ui/react";

// assets
import { InformationCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";

// types
import type { ReactNode } from "react";
import type { LocalizedContent } from "@/domain";

interface ExperienceModalProps {
  localizedContent: LocalizedContent;
  children: ReactNode;
}

export function ExperienceModal({ localizedContent, children }: ExperienceModalProps) {
  const [experience, setExperience] = useAtom(experienceAtom);

  return (
    <Dialog.Root open={Option.isSome(experience)} onOpenChange={(open) => !open && setExperience(Option.none())}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 bg-black opacity-75",
            "transition-opacity duration-300 ease-in-out",
            "data-ending-style:opacity-0 data-starting-style:opacity-0",
            "supports-[-webkit-touch-callout:none]:absolute"
          )}
        />
        <Dialog.Viewport className="fixed inset-0 flex items-center justify-center overflow-hidden">
          <Dialog.Popup
            className={cn(
              "relative max-h-[90dvh] w-[90dvw] max-w-3xl overflow-auto bg-background p-1 text-foreground",
              "transition duration-300 ease-in-out",
              "data-ending-style:scale-90 data-ending-style:opacity-0 data-starting-style:scale-90 data-starting-style:opacity-0"
            )}
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
              <Button className="button" onClick={() => setExperience(Option.none())}>
                <XCircleIcon className="size-9" />
              </Button>
            </header>
            {children}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
