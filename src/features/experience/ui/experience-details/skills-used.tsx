// services, features, and other libraries
import { cn } from "@/lib/utils";
import { useGT } from "gt-tanstack-start";

// types
import type { Experience } from "@/features/experience/domain";

interface SkillsUsedProps {
  experience: Experience;
}

// constants
// How much later each chip settles in, so the skill list assembles itself instead of popping in all at once
const ENTER_STAGGER_SECONDS = 0.6;

// The skills a project leaned on, as glowing chips: they rise in one after another, and pick up the same neon
// halo the link chips cast when the pointer comes near
export function SkillsUsed({ experience: { skillsUsed } }: SkillsUsedProps) {
  const gt = useGT();

  return (
    <aside className="my-9">
      <h4 className="mx-auto my-3 text-center tracking-widest text-accent uppercase">{gt("Skills Used")}</h4>
      <ul className="flex list-none flex-wrap items-center justify-center gap-2 text-center">
        {skillsUsed.map((skillUsed, index) => (
          <li
            key={index}
            className={cn(
              "animate-rise rounded-full border border-text-1 bg-surface-1 px-3 py-1 text-text-2 transition duration-300 select-none",
              "hover:-translate-y-0.5 hover:border-accent hover:text-accent hover:shadow-[0_0_6px_var(--accent),0_0_12px_var(--accent)]"
            )}
            style={{ animationDelay: `${index * ENTER_STAGGER_SECONDS}s` }}
          >
            {skillUsed}
          </li>
        ))}
      </ul>
    </aside>
  );
}
