// components
import { ExperienceIdentity } from "@/features/experience/ui/experience-identity";

// types
import type { ReactNode } from "react";
import type { Experience } from "@/features/experience/domain";

interface ExperienceHeaderProps {
  experience: Experience;
  children: ReactNode;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

// Shared experience header layout: identity (year, role, company) on the left, action chips on the right
export function ExperienceHeader({ experience, children, headingLevel = 2 }: ExperienceHeaderProps) {
  return (
    <header className="mb-4 flex min-h-28 gap-4 @md:min-h-auto">
      <ExperienceIdentity experience={experience} headingLevel={headingLevel} />
      <div className="flex-3">
        <div className="flex flex-wrap items-center justify-end gap-2">{children}</div>
      </div>
    </header>
  );
}
