// components
import { ExperienceIdentity } from "@/features/experience/ui/experience-identity";
import { ExperienceLinks } from "@/features/experience/ui/experience-links";

// types
import type { Experience } from "@/features/experience/domain";

interface DetailsHeaderProps {
  experience: Experience;
}

export function DetailsHeader({ experience }: DetailsHeaderProps) {
  return (
    <header className="mb-4 flex min-h-28 gap-4 @md:min-h-auto">
      <ExperienceIdentity experience={experience} />
      <section className="flex-3">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ExperienceLinks experience={experience} iconClassName="size-11" />
        </div>
      </section>
    </header>
  );
}
