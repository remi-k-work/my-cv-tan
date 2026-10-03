// types
import type { Experience, LocalizedContent } from "@/domain";

interface SkillsUsedProps {
  localizedContent: LocalizedContent;
  experience: Experience;
}

export function SkillsUsed({ localizedContent, experience: { skillsUsed } }: SkillsUsedProps) {
  return (
    <aside className="my-4">
      <h4 className="text-sm font-semibold tracking-widest text-accent">{localizedContent["experienceDetails"]["skillsUsed"]}</h4>
      <ul className="flex list-none flex-wrap items-center justify-center">
        {skillsUsed.map((skillUsed, index) => (
          <li key={index} className="text-text-2 before:mx-2 before:text-accent before:content-['●']">
            {skillUsed}
          </li>
        ))}
      </ul>
    </aside>
  );
}
