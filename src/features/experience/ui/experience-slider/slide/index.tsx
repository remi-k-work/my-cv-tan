// services, features, and other libraries
import { excerpt } from "@/features/experience/domain";

// components
import { Header } from "./header";
import { ScreenShots } from "./screen-shots";

// types
import type { LocalizedContent } from "@/domain";
import type { Experience } from "@/features/experience/domain";

interface SlideProps {
  localizedContent: LocalizedContent;
  experience: Experience;
}

export function Slide({ localizedContent, experience, experience: { txt, liveLink, videoLink } }: SlideProps) {
  return (
    <article className="@container relative rounded-xl bg-surface-1 p-3 select-none">
      <Header localizedContent={localizedContent} experience={experience} />
      {liveLink || videoLink ? (
        <a href={videoLink ?? liveLink} target="_blank" rel="noopener noreferrer">
          <ScreenShots experience={experience} />
        </a>
      ) : (
        <ScreenShots experience={experience} />
      )}
      <p className="mx-auto mt-3 text-justify text-sm">{excerpt(txt, 240)}</p>
    </article>
  );
}
