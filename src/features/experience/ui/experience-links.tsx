// components
import { LinkChip } from "@/features/experience/ui/link-chip";

// assets
import { GlobeAltIcon, VideoCameraIcon } from "@heroicons/react/24/solid";
import { GitHubIcon } from "@/assets/icons";

// types
import type { Experience } from "@/features/experience/domain";

interface ExperienceLinksProps {
  experience: Experience;
  // Localized section that provides "liveLink", "goAndSee" and "watchVideo"
  labels: Record<string, string>;
  iconClassName: string;
}

// External links for an experience, rendered only for the links that exist
export function ExperienceLinks({ experience: { gitHubLink, liveLink, videoLink }, labels, iconClassName }: ExperienceLinksProps) {
  return (
    <>
      {liveLink && (
        <LinkChip href={liveLink} title={labels["liveLink"]}>
          <GlobeAltIcon className={iconClassName} />
        </LinkChip>
      )}
      {gitHubLink && (
        <LinkChip href={gitHubLink} title={labels["goAndSee"]}>
          <GitHubIcon className={iconClassName} />
        </LinkChip>
      )}
      {videoLink && (
        <LinkChip href={videoLink} title={labels["watchVideo"]}>
          <VideoCameraIcon className={iconClassName} />
        </LinkChip>
      )}
    </>
  );
}
