// services, features, and other libraries
import { Array, Option, pipe } from "effect";
import { useGT } from "gt-tanstack-start";

// components
import { LinkChip } from "@/features/experience/ui/link-chip";

// assets
import GlobeAltIcon from "@heroicons/react/24/solid/GlobeAltIcon";
import VideoCameraIcon from "@heroicons/react/24/solid/VideoCameraIcon";
import { GitHubIcon } from "@/assets/icons/github";

// types
import type { ElementType } from "react";
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
// Each candidate link is an Option, so discarding the absent ones is type-safe rather than
// a hand-written type guard; links are filtered before their icon elements are created, so
// a link without a URL never renders (and discards) an icon, and the icon components stay
// out of the filtered array rather than being rebuilt on every render
export function ExperienceLinks({ experience, iconClassName }: ExperienceLinksProps) {
  const gt = useGT();

  const { role, company, gitHubLink, liveLink, videoLink } = experience;

  // Repeated chips ("Live Link", "GitHub Repo") are told apart by the experience they belong to
  const context = `${role}, ${company}`;

  const link = (href: string | undefined, title: string, icon: ElementType): Option.Option<ExperienceLink> =>
    Option.map(Option.fromNullishOr(href), (href) => ({ href, title, icon }));

  const existingLinks = pipe(
    [link(liveLink, gt("Live Link"), GlobeAltIcon), link(gitHubLink, gt("GitHub Repo"), GitHubIcon), link(videoLink, gt("Watch Video"), VideoCameraIcon)],
    Array.getSomes
  );

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
