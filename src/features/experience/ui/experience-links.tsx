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
export function ExperienceLinks({ experience, iconClassName }: ExperienceLinksProps) {
  const gt = useGT();

  const { role, company, gitHubLink, liveLink, videoLink } = experience;

  // Repeated chips ("Live Link", "GitHub Repo") are told apart by the experience they belong to
  const context = `${role}, ${company}`;

  return (
    <ul className="contents">
      {liveLink && (
        <li className="contents">
          <LinkChip href={liveLink} title={gt("Live Link")} context={context}>
            <GlobeAltIcon className={iconClassName} />
          </LinkChip>
        </li>
      )}
      {gitHubLink && (
        <li className="contents">
          <LinkChip href={gitHubLink} title={gt("GitHub Repo")} context={context}>
            <GitHubIcon className={iconClassName} />
          </LinkChip>
        </li>
      )}
      {videoLink && (
        <li className="contents">
          <LinkChip href={videoLink} title={gt("Watch Video")} context={context}>
            <VideoCameraIcon className={iconClassName} />
          </LinkChip>
        </li>
      )}
    </ul>
  );
}
