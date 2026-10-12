// tanstack
import { Link } from "@tanstack/react-router";

// services, features, and other libraries
import { Option } from "effect";
import { useAtomSet } from "@effect/atom-react";
import { useGT } from "gt-tanstack-start";
import { experienceAtom } from "@/features/modals/state";

// components
import { ExperienceHeader } from "@/features/experience/ui/experience-header";
import { ExperienceLinks } from "@/features/experience/ui/experience-links";

// assets
import { InformationCircleIcon } from "@heroicons/react/24/solid";

// types
import type { MouseEvent } from "react";
import type { Experience } from "@/features/experience/domain";

interface SlideHeaderProps {
  experience: Experience;
}

// The slide's header adds the "More Info" action, which opens the details overlay instead of navigating
export function SlideHeader({ experience, experience: { slug } }: SlideHeaderProps) {
  const gt = useGT();
  const setExperience = useAtomSet(experienceAtom);

  function handleMoreInfoClicked(ev: MouseEvent) {
    ev.preventDefault();
    setExperience(Option.some(experience));
  }

  return (
    <ExperienceHeader experience={experience}>
      <Link
        className="rounded-full border border-text-1 p-1 hover:scale-110 hover:border-accent hover:text-accent"
        to="/{-$slug}"
        params={{ slug }}
        onClick={handleMoreInfoClicked}
        title={gt("More Info")}
      >
        <InformationCircleIcon className="size-9" />
      </Link>
      <ExperienceLinks experience={experience} iconClassName="size-9" />
    </ExperienceHeader>
  );
}
