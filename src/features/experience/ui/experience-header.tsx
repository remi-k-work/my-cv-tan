// components
import { ExperienceIdentity } from "@/features/experience/ui/experience-identity";

// types
import type { ReactNode } from "react";
import type { Experience } from "@/features/experience/domain";

interface ExperienceHeaderProps {
  experience: Experience;
  children: ReactNode;
}

// Shared experience header layout: identity (year, role, company) on the left, action chips on the right
export function ExperienceHeader({ experience, children }: ExperienceHeaderProps) {
  return (
    <header className="mb-4 flex min-h-28 gap-4 @md:min-h-auto">
      <ExperienceIdentity experience={experience} />
      <section className="flex-3">
        <div className="flex flex-wrap items-center justify-end gap-2">{children}</div>
      </section>
    </header>
  );
}
