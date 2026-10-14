// services, features, and other libraries
import { useGT } from "gt-tanstack-start";

// types
import type { Experience } from "@/features/experience/domain";

interface SkillsUsedProps {
  experience: Experience;
}

export function SkillsUsed({ experience: { skillsUsed } }: SkillsUsedProps) {
  const gt = useGT();

  return (
    <aside className="my-4">
      <h4 className="mx-auto text-center tracking-widest text-accent uppercase">{gt("Skills Used")}</h4>
      <ul className="flex list-none flex-wrap items-center justify-center text-center">
        {skillsUsed.map((skillUsed, index) => (
          <li key={index} className="text-text-2 before:mx-2 before:text-accent before:content-['●']">
            {skillUsed}
          </li>
        ))}
      </ul>
    </aside>
  );
}
