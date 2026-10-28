// react
import type { ElementType } from "react";

// services, features, and other libraries
import { useGT } from "gt-tanstack-start";

// components
import { LinkChip } from "@/features/experience/ui/link-chip";

// assets
import GlobeAltIcon from "@heroicons/react/24/solid/GlobeAltIcon";
import VideoCameraIcon from "@heroicons/react/24/solid/VideoCameraIcon";
import { GitHubIcon } from "@/assets/icons/github";

// types
import type { Experience } from "@/features/experience/domain/models";

interface ExperienceLinksProps {
  experience: Experience;
  iconClassName: string;
}

interface ExperienceLink {
  href: string;
  title: string;
  icon: ElementType;
}

// External links for an experience, rendered only for the links that exist
// Links are filtered before their icon elements are created, so a link without a URL
// never renders (and discards) an icon; keeping the icon components out of the filtered
// array also avoids rebuilding discarded elements on every render
export function ExperienceLinks({ experience, iconClassName }: ExperienceLinksProps) {
  const gt = useGT();

  const { role, company, gitHubLink, liveLink, videoLink } = experience;

  // Repeated chips ("Live Link", "GitHub Repo") are told apart by the experience they belong to
  const context = `${role}, ${company}`;

  const links: ReadonlyArray<{ href: string | undefined; title: string; icon: ElementType }> = [
    { href: liveLink, title: gt("Live Link"), icon: GlobeAltIcon },
    { href: gitHubLink, title: gt("GitHub Repo"), icon: GitHubIcon },
    { href: videoLink, title: gt("Watch Video"), icon: VideoCameraIcon },
  ];

  const existingLinks = links.filter((link): link is ExperienceLink => link.href !== undefined);

  return (
    <ul className="contents">
      {existingLinks.map((link, index) => {
        const Icon = link.icon;

        return (
          <li key={index} className="contents">
            <LinkChip href={link.href} title={link.title} context={context}>
              <Icon className={iconClassName} />
            </LinkChip>
          </li>
        );
      })}
    </ul>
  );
}
