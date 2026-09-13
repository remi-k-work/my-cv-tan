// components
import SlideSeo from "./slide/SeoVer";

// types
import type { JobExperience } from "@/types/shared";

interface ExperienceSliderSeoProps {
  allExperiences: [JobExperience[], JobExperience[]];
  type: "e" | "p";
}

export default function ExperienceSliderSeo({ allExperiences, type }: ExperienceSliderSeoProps) {
  return (
    <article className="sr-only">
      {allExperiences[type === "e" ? 0 : 1].map((singleJobExperience, jobIndex) => (
        <SlideSeo key={jobIndex} experience={singleJobExperience} />
      ))}
    </article>
  );
}
