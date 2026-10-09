// components
import { ExperienceLinks } from "@/features/experience/ui/experience-links";

// types
import type { Experience } from "@/features/experience/domain";

interface DetailsHeaderProps {
  experience: Experience;
}

export function DetailsHeader({ experience }: DetailsHeaderProps) {
  const { year, role, company } = experience;

  return (
    <header className="mb-4 flex min-h-28 gap-4 @md:min-h-auto">
      <section className="flex-4">
        <p className="text-sm font-semibold tracking-widest text-accent">{year}</p>
        <h2 className="text-xl">{role}</h2>
        <p className="text-text-2">{company}</p>
      </section>
      <section className="flex-3">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ExperienceLinks experience={experience} iconClassName="size-11" />
        </div>
      </section>
    </header>
  );
}
