// services, features, and other libraries
import { Array, Option } from "effect";
import { useGT } from "gt-tanstack-start";
import { validatedHref } from "@/features/meta/domain/urls";

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

// The schema accepts any non-empty string, so the HTML chips apply the same http(s) guard the
// Markdown twin and the JSON-LD graph apply: a malformed destination renders nowhere, not just in the head
const link = (rawHref: string | undefined, title: string, Icon: ElementType) => Option.map(validatedHref(rawHref), (href) => ({ href, title, Icon }));

// External links for an experience, rendered only for the links that exist
export function ExperienceLinks({ experience: { role, company, gitHubLink, liveLink, videoLink }, iconClassName }: ExperienceLinksProps) {
  const gt = useGT();

  // Repeated chips ("Live Link", "GitHub Repo") are told apart by the experience they belong to
  const context = `${role}, ${company}`;

  const existingLinks = Array.getSomes([
    link(liveLink, gt("Live Link"), GlobeAltIcon),
    link(gitHubLink, gt("GitHub Repo"), GitHubIcon),
    link(videoLink, gt("Watch Video"), VideoCameraIcon),
  ]);

  return (
    <ul className="contents">
      {existingLinks.map(({ href, title, Icon }) => (
        <li key={href} className="contents">
          <LinkChip href={href} title={title} context={context}>
            <Icon className={iconClassName} />
          </LinkChip>
        </li>
      ))}
    </ul>
  );
}
