// components
import { SlideSeo } from "./slide/slide-seo";

// types
import type { ExperienceList } from "@/domain";

interface ExperienceSliderSeoProps {
  experienceList: ExperienceList;
}

export function ExperienceSliderSeo({ experienceList }: ExperienceSliderSeoProps) {
  return (
    <article className="sr-only">
      {experienceList.map((experience, index) => (
        <SlideSeo key={index} experience={experience} />
      ))}
    </article>
  );
}
