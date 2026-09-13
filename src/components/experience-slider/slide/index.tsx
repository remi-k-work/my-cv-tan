// next
import Link from "next/link";

// components
import Header from "./Header";
import ScreenShots from "./ScreenShots";

// types
import type { JobExperience, LocalizedContent } from "@/types/shared";
import type { UrlObject } from "url";

interface SlideProps {
  localizedContent: LocalizedContent;
  type: "e" | "p";
  index: number;
  experience: JobExperience;
}

export default function Slide({ localizedContent, type, index, experience, experience: { liveLink, videoLink } }: SlideProps) {
  return (
    <article className="bg-background @container relative rounded-xl p-3 select-none">
      <Header localizedContent={localizedContent} type={type} index={index} experience={experience} />
      {liveLink || videoLink ? (
        <Link href={(videoLink ?? liveLink) as UrlObject} prefetch={false} target="_blank" rel="noopener noreferrer">
          <ScreenShots experience={experience} />
        </Link>
      ) : (
        <ScreenShots experience={experience} />
      )}
    </article>
  );
}
