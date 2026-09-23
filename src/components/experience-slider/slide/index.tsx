// components
import Header from "./Header";
import ScreenShots from "./ScreenShots";

// types
import type { Experience, LocalizedContent } from "@/types/shared";

interface SlideProps {
  localizedContent: LocalizedContent;
  experience: Experience;
}

export default function Slide({ localizedContent, experience, experience: { liveLink, videoLink } }: SlideProps) {
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
