// components
import SlideSeo from "./slide/SeoVer";

// types
import type { Experience } from "@/types/shared";

interface ExperienceSliderSeoProps {
  experience: [Experience[], Experience[]];
  type: "e" | "p";
}

export default function ExperienceSliderSeo({ experience, type }: ExperienceSliderSeoProps) {
  return (
    <article className="sr-only">
      {experience[type === "e" ? 0 : 1].map((experienceT, index) => (
        <SlideSeo key={index} experience={experienceT} />
      ))}
    </article>
  );
}
