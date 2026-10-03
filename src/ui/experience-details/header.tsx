// assets
import { GlobeAltIcon, VideoCameraIcon } from "@heroicons/react/24/solid";
import { GitHubIcon } from "@/assets/icons";

// types
import type { Experience, LocalizedContent } from "@/domain";

interface HeaderProps {
  localizedContent: LocalizedContent;
  experience: Experience;
}

export function Header({ localizedContent, experience: { year, role, company, gitHubLink, liveLink, videoLink } }: HeaderProps) {
  return (
    <header className="mb-4 flex min-h-28 gap-4 @md:min-h-auto">
      <section className="flex-4">
        <p className="text-sm font-semibold tracking-widest text-accent">{year}</p>
        <h2 className="text-xl">{role}</h2>
        <p className="text-text-2">{company}</p>
      </section>
      <section className="flex-3">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {liveLink && (
            <a
              className="rounded-full border border-text-1 p-1 hover:scale-110 hover:border-accent hover:text-accent"
              href={liveLink}
              target="_blank"
              rel="noopener noreferrer"
              title={localizedContent["experienceDetails"]["liveLink"]}
            >
              <GlobeAltIcon className="size-11" />
            </a>
          )}
          {gitHubLink && (
            <a
              className="rounded-full border border-text-1 p-1 hover:scale-110 hover:border-accent hover:text-accent"
              href={gitHubLink}
              target="_blank"
              rel="noopener noreferrer"
              title={localizedContent["experienceDetails"]["goAndSee"]}
            >
              <GitHubIcon className="size-11" />
            </a>
          )}
          {videoLink && (
            <a
              className="rounded-full border border-text-1 p-1 hover:scale-110 hover:border-accent hover:text-accent"
              href={videoLink}
              target="_blank"
              rel="noopener noreferrer"
              title={localizedContent["experienceDetails"]["watchVideo"]}
            >
              <VideoCameraIcon className="size-11" />
            </a>
          )}
        </div>
      </section>
    </header>
  );
}
