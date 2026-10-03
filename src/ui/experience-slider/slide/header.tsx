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
            title={localizedContent["experienceSlide"]["moreInfo"]}
          >
            <InformationCircleIcon className="size-9" />
          </Link>
          {liveLink && (
            <a
              className="rounded-full border border-text-1 p-1 hover:scale-110 hover:border-accent hover:text-accent"
              href={liveLink}
              target="_blank"
              rel="noopener noreferrer"
              title={localizedContent["experienceSlide"]["liveLink"]}
            >
              <GlobeAltIcon className="size-9" />
            </a>
          )}
          {gitHubLink && (
            <a
              className="rounded-full border border-text-1 p-1 hover:scale-110 hover:border-accent hover:text-accent"
              href={gitHubLink}
              target="_blank"
              rel="noopener noreferrer"
              title={localizedContent["experienceSlide"]["goAndSee"]}
            >
              <GitHubIcon className="size-9" />
            </a>
          )}
          {videoLink && (
            <a
              className="rounded-full border border-text-1 p-1 hover:scale-110 hover:border-accent hover:text-accent"
              href={videoLink}
              target="_blank"
              rel="noopener noreferrer"
              title={localizedContent["experienceSlide"]["watchVideo"]}
            >
              <VideoCameraIcon className="size-9" />
            </a>
          )}
        </div>
      </section>
    </header>
  );
}
