import { GlobeAltIcon, VideoCameraIcon } from "@heroicons/react/24/solid";
import GitHubIcon from "@/assets/icons/GitHub";

import type { JobExperience, LocalizedContent } from "@/types/shared";

interface HeaderProps {
  localizedContent: LocalizedContent;
  experience: JobExperience;
}

export default function Header({ localizedContent, experience: { year, role, company, gitHubLink, liveLink, videoLink } }: HeaderProps) {
  return (
    <header className="mb-4 flex min-h-28 gap-4 @md:min-h-auto">
      <section className="flex-4">
        <p className="text-accent-foreground text-sm font-semibold tracking-widest">{year}</p>
        <h2 className="text-xl">{role}</h2>
        <p className="text-clr-primary-200">{company}</p>
      </section>
      <section className="flex-3">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {liveLink && (
            <a
              href={liveLink}
              target="_blank"
              rel="noopener noreferrer"
              title={localizedContent["experienceDetails"]["liveLink"]}
              className="text-primary-foreground border-primary-foreground hover:text-accent-foreground hover:border-accent-foreground rounded-full border p-1 hover:scale-110"
            >
              <GlobeAltIcon className="size-11" />
            </a>
          )}
          {gitHubLink && (
            <a
              href={gitHubLink}
              target="_blank"
              rel="noopener noreferrer"
              title={localizedContent["experienceDetails"]["goAndSee"]}
              className="text-primary-foreground border-primary-foreground hover:text-accent-foreground hover:border-accent-foreground rounded-full border p-1 hover:scale-110"
            >
              <GitHubIcon className="size-11" />
            </a>
          )}
          {videoLink && (
            <a
              href={videoLink}
              target="_blank"
              rel="noopener noreferrer"
              title={localizedContent["experienceDetails"]["watchVideo"]}
              className="text-primary-foreground border-primary-foreground hover:text-accent-foreground hover:border-accent-foreground rounded-full border p-1 hover:scale-110"
            >
              <VideoCameraIcon className="size-11" />
            </a>
          )}
        </div>
      </section>
    </header>
  );
}
