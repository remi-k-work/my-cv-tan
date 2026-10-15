// react
import { useId } from "react";

// services, features, and other libraries
import { cn } from "@/lib/utils";
import { useGT } from "gt-tanstack-start";

// types
import type { Experience } from "@/features/experience/domain";

interface SkillsUsedProps {
  experience: Experience;
}

// constants
import { MOTION_TOKENS } from "@/lib/motion-tokens";

// The skills a project leaned on
export function SkillsUsed({ experience: { skillsUsed } }: SkillsUsedProps) {
  const gt = useGT();
  const headingId = useId();

  return (
    <section className="my-9" aria-labelledby={headingId}>
      <h3 id={headingId} className="mx-auto my-3 text-center tracking-widest text-accent uppercase">
        {gt("Skills Used")}
      </h3>
      <ul className="flex list-none flex-wrap items-center justify-center gap-2 text-center">
        {skillsUsed.map((skillUsed, index) => (
          <li
            key={index}
            className={cn("animate-rise rounded-full border bg-surface-1 px-3 py-1 text-text-2 select-none", "odd:bg-surface-2")}
            style={{ animationDelay: `${index * MOTION_TOKENS.duration.slow}s` }}
          >
            {skillUsed}
          </li>
        ))}
      </ul>
    </section>
  );
}
