// tanstack
import { Link } from "@tanstack/react-router";

// services, features, and other libraries
import { Option } from "effect";
import { useAtomSet } from "@effect/atom-react";
import { experienceAtom } from "@/features/modals/state";

// assets
import { GlobeAltIcon, InformationCircleIcon, VideoCameraIcon } from "@heroicons/react/24/solid";
import { GitHubIcon } from "@/assets/icons";

// types
import type { MouseEvent } from "react";
import type { Experience, LocalizedContent } from "@/domain";

interface HeaderProps {
  localizedContent: LocalizedContent;
  experience: Experience;
}

export function Header({ localizedContent, experience }: HeaderProps) {
  const { slug, year, role, company, gitHubLink, liveLink, videoLink } = experience;
  const setExperience = useAtomSet(experienceAtom);

  function handleMoreInfoClicked(ev: MouseEvent) {
    ev.preventDefault();
    setExperience(Option.some(experience));
  }

  return (
    <header className="mb-4 flex min-h-28 gap-4 @md:min-h-auto">
      <section className="flex-4">
        <p className="text-sm font-semibold tracking-widest text-accent-foreground">{year}</p>
        <h2 className="text-xl">{role}</h2>
        <p className="text-clr-primary-200">{company}</p>
      </section>
      <section className="flex-3">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            to="/{-$slug}"
            params={{ slug }}
            onClick={handleMoreInfoClicked}
            title={localizedContent["experienceSlide"]["moreInfo"]}
            className="rounded-full border border-primary-foreground p-1 text-primary-foreground hover:scale-110 hover:border-accent-foreground hover:text-accent-foreground"
          >
            <InformationCircleIcon className="size-11" />
          </Link>
          {liveLink && (
            <a
              href={liveLink}
              target="_blank"
              rel="noopener noreferrer"
              title={localizedContent["experienceSlide"]["liveLink"]}
              className="rounded-full border border-primary-foreground p-1 text-primary-foreground hover:scale-110 hover:border-accent-foreground hover:text-accent-foreground"
            >
              <GlobeAltIcon className="size-11" />
            </a>
          )}
          {gitHubLink && (
            <a
              href={gitHubLink}
              target="_blank"
              rel="noopener noreferrer"
              title={localizedContent["experienceSlide"]["goAndSee"]}
              className="rounded-full border border-primary-foreground p-1 text-primary-foreground hover:scale-110 hover:border-accent-foreground hover:text-accent-foreground"
            >
              <GitHubIcon className="size-11" />
            </a>
          )}
          {videoLink && (
            <a
              href={videoLink}
              target="_blank"
              rel="noopener noreferrer"
              title={localizedContent["experienceSlide"]["watchVideo"]}
              className="rounded-full border border-primary-foreground p-1 text-primary-foreground hover:scale-110 hover:border-accent-foreground hover:text-accent-foreground"
            >
              <VideoCameraIcon className="size-11" />
            </a>
          )}
        </div>
      </section>
    </header>
  );
}
