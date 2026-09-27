// components
import SlideSeo from "./slide/SeoVer";

// types
import type { ExperienceList } from "@/domain";

interface ExperienceSliderSeoProps {
  experienceList: ExperienceList;
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
