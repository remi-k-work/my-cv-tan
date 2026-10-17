// types
import type { Experience } from "@/features/experience/domain/models";

interface ExperienceIdentityProps {
  experience: Experience;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

// The experience's identity: year, role, and company, shared by the slider slide header and the details header
export function ExperienceIdentity({ experience: { year, role, company }, headingLevel = 2 }: ExperienceIdentityProps) {
  const Heading = `h${headingLevel}` as const;

  return (
    <div className="flex-4">
      <p className="text-sm font-semibold tracking-widest text-accent">{year}</p>
      <Heading className="text-xl">{role}</Heading>
      <p className="text-text-2">{company}</p>
    </div>
  );
}
