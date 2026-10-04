// services, features, and other libraries
import { cn } from "@/lib/utils";
import { Option } from "effect";
import { useAtom } from "@effect/atom-react";
import { experienceAtom } from "@/features/modals/state";

// components
import { Button, Dialog } from "@base-ui/react";
import { RevealText } from "@/ui/reveal-text";

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
              "relative max-h-[90dvh] w-[90dvw] max-w-3xl overflow-auto bg-surface-1 p-1 text-text-1",
              "transition duration-300 ease-in-out",
              "data-ending-style:scale-90 data-ending-style:opacity-0 data-starting-style:scale-90 data-starting-style:opacity-0"
            )}
          >
            <header className="flex items-center justify-between gap-4 p-1">
              <section className="flex items-center gap-2 text-text-2">
                <InformationCircleIcon className="size-11 flex-none" />
                <h3 className="inline-grid flex-1 overflow-clip text-xl tracking-widest uppercase">
                  <RevealText>{localizedContent["experienceModal"]["projectInfo"]}</RevealText>
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
