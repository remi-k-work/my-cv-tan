// components
import { Header } from "./header";
import { ScreenShots } from "./screen-shots";

// types
import type { Experience, LocalizedContent } from "@/domain";

interface SlideProps {
  localizedContent: LocalizedContent;
  experience: Experience;
}

export function Slide({ localizedContent, experience, experience: { liveLink, videoLink } }: SlideProps) {
  return (
    <article className="@container relative rounded-xl bg-background p-3 select-none">
      <Header localizedContent={localizedContent} experience={experience} />
      {liveLink || videoLink ? (
        <a href={videoLink ?? liveLink} target="_blank" rel="noopener noreferrer">
          <ScreenShots experience={experience} />
        </a>
      ) : (
        <ScreenShots experience={experience} />
      )}
    </article>
  );
}
