// services, features, and other libraries
import { useGT } from "gt-tanstack-start";

// components
import { LinkChip } from "@/features/experience/ui/link-chip";

// assets
import { GlobeAltIcon, VideoCameraIcon } from "@heroicons/react/24/solid";
import { GitHubIcon } from "@/assets/icons";

// types
import type { Experience } from "@/features/experience/domain";

interface ExperienceLinksProps {
  experience: Experience;
  iconClassName: string;
}

// External links for an experience, rendered only for the links that exist
export function ExperienceLinks({ experience: { gitHubLink, liveLink, videoLink }, iconClassName }: ExperienceLinksProps) {
  const gt = useGT();

  return (
    <>
      {liveLink && (
        <LinkChip href={liveLink} title={gt("Live Link")}>
          <GlobeAltIcon className={iconClassName} />
        </LinkChip>
      )}
      {gitHubLink && (
        <LinkChip href={gitHubLink} title={gt("Go and see the GitHub Repo")}>
          <GitHubIcon className={iconClassName} />
        </LinkChip>
      )}
      {videoLink && (
        <LinkChip href={videoLink} title={gt("Watch Video")}>
          <VideoCameraIcon className={iconClassName} />
        </LinkChip>
      )}
    </>
  );
}
