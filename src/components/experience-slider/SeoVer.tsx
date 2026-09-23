// components
import SlideSeo from "./slide/SeoVer";

// types
import type { Experience } from "@/types/shared";

interface ExperienceSliderSeoProps {
  experienceList: Experience[];
}

export default function ExperienceSliderSeo({ experienceList }: ExperienceSliderSeoProps) {
  return (
    <article className="sr-only">
      {experienceList.map((experience, index) => (
        <SlideSeo key={index} experience={experience} />
      ))}
    </article>
  );
}
