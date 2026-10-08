// services, features, and other libraries
import { useGT } from "gt-tanstack-start";

// types
import type { Experience } from "@/features/experience/domain";

interface SkillsUsedProps {
  experience: Experience;
}

// constants
import { UI_COPY } from "@/features/data/domain/ui-copy";

export function SkillsUsed({ experience: { skillsUsed } }: SkillsUsedProps) {
  const gt = useGT();

  return (
    <aside className="my-4">
      <h4 className="text-sm font-semibold tracking-widest text-accent">{gt(UI_COPY.experienceDetails.skillsUsed)}</h4>
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
