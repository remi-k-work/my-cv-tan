// services, features, and other libraries
import { Array, pipe } from "effect";
import { excerpt } from "@/features/experience/domain";
import { absoluteUrl } from "@/features/meta/domain";
import { escapeMdInline, mdLabel } from "./helpers";

// types
import type { PreferredLanguage } from "@/domain";
import type { Experience, ExperienceList } from "@/features/experience/domain";

// One line per experience in AI indexes: label links the .md twin, excerpt carries the substance
export const experienceLine = (experience: Experience) =>
  `- [${escapeMdInline(`${experience.role} at ${experience.company}`)}](${absoluteUrl(`/${experience.slug}.md`)}) — ${escapeMdInline(excerpt(experience.txt, 140))} (${escapeMdInline(experience.year)})`;

// Section body lines for one experience type, or an explicit empty marker (never a bare heading)
export const experienceLines = (experienceList: ExperienceList, type: Experience["type"], preferredLanguage: PreferredLanguage = "en") =>
  pipe(
    experienceList,
    Array.filter((experience) => experience.type === type),
    Array.map(experienceLine),
    Array.join("\n"),
    (lines) => (lines === "" ? `_${mdLabel(preferredLanguage, "No entries.", "Brak wpisów.")}_` : lines)
  );
