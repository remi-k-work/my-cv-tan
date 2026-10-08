// services, features, and other libraries
import { excerpt } from "@/features/experience/domain";

// components
import { SlideHeader } from "./header";
import { ScreenShots } from "@/features/experience/ui/screen-shots";

// types
import type { LocalizedContent } from "@/domain";
import type { Experience } from "@/features/experience/domain";

interface SlideProps {
  localizedContent: LocalizedContent;
  experience: Experience;
}

export function Slide({ localizedContent, experience, experience: { txt } }: SlideProps) {
  return (
    <article className="@container relative rounded-xl bg-surface-1 p-3 select-none">
      <SlideHeader localizedContent={localizedContent} experience={experience} />
      <ScreenShots experience={experience} />
      <p className="mx-auto mt-3 text-justify text-sm">{excerpt(txt, 240)}</p>
    </article>
  );
}
