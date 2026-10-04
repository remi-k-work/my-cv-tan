// components
import { LinkChip } from "@/features/experience/ui/link-chip";

// assets
import { GlobeAltIcon, VideoCameraIcon } from "@heroicons/react/24/solid";
import { GitHubIcon } from "@/assets/icons";

// types
import type { LocalizedContent } from "@/domain";
import type { Experience } from "@/features/experience/domain";

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
            <LinkChip href={liveLink} title={localizedContent["experienceDetails"]["liveLink"]}>
              <GlobeAltIcon className="size-11" />
            </LinkChip>
          )}
          {gitHubLink && (
            <LinkChip href={gitHubLink} title={localizedContent["experienceDetails"]["goAndSee"]}>
              <GitHubIcon className="size-11" />
            </LinkChip>
          )}
          {videoLink && (
            <LinkChip href={videoLink} title={localizedContent["experienceDetails"]["watchVideo"]}>
              <VideoCameraIcon className="size-11" />
            </LinkChip>
          )}
        </div>
      </section>
    </header>
  );
}
