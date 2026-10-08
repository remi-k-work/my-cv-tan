// tanstack
import { Link } from "@tanstack/react-router";

// services, features, and other libraries
import { Option } from "effect";
import { useAtomSet } from "@effect/atom-react";
import { useGT } from "gt-tanstack-start";
import { experienceAtom } from "@/features/modals/state";

// components
import { ExperienceLinks } from "@/features/experience/ui/experience-links";

// assets
import { InformationCircleIcon } from "@heroicons/react/24/solid";

// types
import type { MouseEvent } from "react";
import type { Experience } from "@/features/experience/domain";

interface SlideHeaderProps {
  experience: Experience;
}

// constants
import { UI_COPY } from "@/features/data/domain/ui-copy";

export function SlideHeader({ experience }: SlideHeaderProps) {
  const gt = useGT();
  const { slug, year, role, company } = experience;
  const setExperience = useAtomSet(experienceAtom);

  function handleMoreInfoClicked(ev: MouseEvent) {
    ev.preventDefault();
    setExperience(Option.some(experience));
  }

  return (
    <header className="mb-4 flex min-h-28 gap-4 @md:min-h-auto">
      <section className="flex-4">
        <p className="text-sm font-semibold tracking-widest text-accent">{year}</p>
        <h2 className="text-xl">{role}</h2>
        <p className="text-text-2">{company}</p>
      </section>
      <section className="flex-3">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            className="rounded-full border border-text-1 p-1 hover:scale-110 hover:border-accent hover:text-accent"
            to="/{-$slug}"
            params={{ slug }}
            onClick={handleMoreInfoClicked}
            title={gt(UI_COPY.experienceSlide.moreInfo)}
          >
            <InformationCircleIcon className="size-9" />
          </Link>
          <ExperienceLinks experience={experience} labels={UI_COPY.experienceSlide} iconClassName="size-9" />
        </div>
      </section>
    </header>
  );
}
