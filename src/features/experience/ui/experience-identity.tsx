// types
import type { Experience } from "@/features/experience/domain";

interface ExperienceIdentityProps {
  experience: Experience;
}

// The experience's identity: year, role, and company, shared by the slider slide header and the details header
export function ExperienceIdentity({ experience: { year, role, company } }: ExperienceIdentityProps) {
  return (
    <section className="flex-4">
      <p className="text-sm font-semibold tracking-widest text-accent">{year}</p>
      <h2 className="text-xl">{role}</h2>
      <p className="text-text-2">{company}</p>
    </section>
  );
}
