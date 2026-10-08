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
  labels: Pick<typeof UI_COPY.experienceSlide, "liveLink" | "goAndSee" | "watchVideo">;
  iconClassName: string;
}

// constants
import { UI_COPY } from "@/features/data/domain/ui-copy";

// External links for an experience, rendered only for the links that exist
export function ExperienceLinks({ experience: { gitHubLink, liveLink, videoLink }, labels, iconClassName }: ExperienceLinksProps) {
  const gt = useGT();

  return (
    <>
      {liveLink && (
        <LinkChip href={liveLink} title={gt(labels.liveLink)}>
          <GlobeAltIcon className={iconClassName} />
        </LinkChip>
      )}
      {gitHubLink && (
        <LinkChip href={gitHubLink} title={gt(labels.goAndSee)}>
          <GitHubIcon className={iconClassName} />
        </LinkChip>
      )}
      {videoLink && (
        <LinkChip href={videoLink} title={gt(labels.watchVideo)}>
          <VideoCameraIcon className={iconClassName} />
        </LinkChip>
      )}
    </>
  );
}
