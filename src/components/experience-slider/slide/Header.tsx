// next
import Link from "next/link";

// assets
import { GlobeAltIcon, InformationCircleIcon, VideoCameraIcon } from "@heroicons/react/24/solid";
import GitHubIcon from "@/assets/icons/GitHub";

// types
import type { JobExperience, LocalizedContent } from "@/types/shared";
import type { UrlObject } from "url";

interface HeaderProps {
  localizedContent: LocalizedContent;
  type: "e" | "p";
  index: number;
  experience: JobExperience;
}

export default function Header({ localizedContent, type, index, experience: { year, role, company, gitHubLink, liveLink, videoLink } }: HeaderProps) {
  return (
    <header className="mb-4 flex min-h-28 gap-4 @md:min-h-auto">
      <section className="flex-4">
        <p className="text-accent-foreground text-sm font-semibold tracking-widest">{year}</p>
        <h2 className="text-xl">{role}</h2>
        <p className="text-clr-primary-200">{company}</p>
      </section>
      <section className="flex-3">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            href={`/exp/${type}/${index}`}
            title={localizedContent["experienceSlide"]["moreInfo"]}
            className="text-primary-foreground border-primary-foreground hover:text-accent-foreground hover:border-accent-foreground rounded-full border p-1 hover:scale-110"
          >
            <InformationCircleIcon className="size-11" />
          </Link>
          {liveLink && (
            <Link
              href={liveLink as UrlObject}
              target="_blank"
              rel="noopener noreferrer"
              title={localizedContent["experienceSlide"]["liveLink"]}
              className="text-primary-foreground border-primary-foreground hover:text-accent-foreground hover:border-accent-foreground rounded-full border p-1 hover:scale-110"
            >
              <GlobeAltIcon className="size-11" />
            </Link>
          )}
          {gitHubLink && (
            <Link
              href={gitHubLink as UrlObject}
              target="_blank"
              rel="noopener noreferrer"
              title={localizedContent["experienceSlide"]["goAndSee"]}
              prefetch={false}
              className="text-primary-foreground border-primary-foreground hover:text-accent-foreground hover:border-accent-foreground rounded-full border p-1 hover:scale-110"
            >
              <GitHubIcon className="size-11" />
            </Link>
          )}
          {videoLink && (
            <Link
              href={videoLink as UrlObject}
              target="_blank"
              rel="noopener noreferrer"
              title={localizedContent["experienceSlide"]["watchVideo"]}
              prefetch={false}
              className="text-primary-foreground border-primary-foreground hover:text-accent-foreground hover:border-accent-foreground rounded-full border p-1 hover:scale-110"
            >
              <VideoCameraIcon className="size-11" />
            </Link>
          )}
        </div>
      </section>
    </header>
  );
}
