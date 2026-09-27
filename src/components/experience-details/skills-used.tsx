// types
import type { Experience, LocalizedContent } from "@/domain";

interface SkillsUsedProps {
  localizedContent: LocalizedContent;
  experience: Experience;
}

export function SkillsUsed({ localizedContent, experience: { skillsUsed } }: SkillsUsedProps) {
  return (
    <aside className="my-4">
      <h4 className="text-sm font-semibold tracking-widest text-accent-foreground">{localizedContent["experienceDetails"]["skillsUsed"]}</h4>
      <ul className="flex list-none flex-wrap items-center sm:justify-around">
        {skillsUsed.map((skillUsed, index) => (
          <li key={index} className="before:mx-2 before:text-accent-foreground before:content-['●'] odd:text-clr-primary-200 even:text-primary-foreground">
            {skillUsed}
          </li>
        ))}
      </ul>
    </aside>
  );
}
