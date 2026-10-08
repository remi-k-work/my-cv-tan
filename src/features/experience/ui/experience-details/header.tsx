// components
import { ExperienceLinks } from "@/features/experience/ui/experience-links";

// types
import type { LocalizedContent } from "@/domain";
import type { Experience } from "@/features/experience/domain";

interface DetailsHeaderProps {
  localizedContent: LocalizedContent;
  experience: Experience;
}

export function DetailsHeader({ localizedContent, experience }: DetailsHeaderProps) {
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
          <ExperienceLinks experience={experience} labels={localizedContent["experienceDetails"]} iconClassName="size-11" />
        </div>
      </section>
    </header>
  );
}
