// services, features, and other libraries
import { cn } from "@/lib/utils";
import { Option } from "effect";
import { useAtomSet } from "@effect/atom-react";
import { useGT } from "gt-tanstack-start";
import { experienceAtom } from "@/features/modals/state/experience";

// components
import { ExperienceHeader } from "@/features/experience/ui/experience-header";
import { ExperienceLinks } from "@/features/experience/ui/experience-links";

// assets
import InformationCircleIcon from "@heroicons/react/24/solid/InformationCircleIcon";

// types
import type { Experience } from "@/features/experience/domain/models";

interface SlideHeaderProps {
  experience: Experience;
}

// The slide's header adds the "More Info" action, which opens the details overlay instead of navigating
export function SlideHeader({ experience, experience: { role, company } }: SlideHeaderProps) {
  const gt = useGT();
  const setExperience = useAtomSet(experienceAtom);

  return (
    <ExperienceHeader experience={experience} headingLevel={3}>
      <button
        type="button"
        className={cn(
          "rounded-full border border-text-1 p-1",
          "hover:scale-110 hover:border-accent hover:text-accent",
          "hover:shadow-[0_0_6px_var(--accent),0_0_12px_var(--accent)]",
          // Press feedback mirroring the .button utilities
          "active:scale-95 active:shadow-none"
        )}
        title={gt("More Info")}
        aria-label={`${gt("More Info")} — ${role}, ${company}`}
        onClick={() => setExperience(Option.some(experience))}
      >
        <InformationCircleIcon className="size-9" aria-hidden="true" />
      </button>
      <ExperienceLinks experience={experience} iconClassName="size-9" />
    </ExperienceHeader>
  );
}
