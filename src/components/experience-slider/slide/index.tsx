// components
import Header from "./Header";
import ScreenShots from "./ScreenShots";

// types
import type { JobExperience, LocalizedContent } from "@/types/shared";

interface SlideProps {
  localizedContent: LocalizedContent;
  type: "e" | "p";
  index: number;
  experience: JobExperience;
}

export default function Slide({ localizedContent, type, index, experience, experience: { liveLink, videoLink } }: SlideProps) {
  return (
    <article className="@container relative rounded-xl bg-background p-3 select-none">
      <Header localizedContent={localizedContent} type={type} index={index} experience={experience} />
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
