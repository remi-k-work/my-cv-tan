// services, features, and other libraries
import { Array, pipe } from "effect";
import { msg } from "gt-tanstack-start";
import { excerpt } from "@/features/experience/domain";
import { experienceMarkdownHref } from "@/features/meta/domain";
import { escapeMdInline } from "./helpers";

// types
import type { Experience, ExperienceList } from "@/features/experience/domain";
import type { Translate } from "./models";

// One line per experience in AI indexes: label links the .md twin, excerpt carries the substance
export const experienceLine = (experience: Experience) =>
  `- [${escapeMdInline(`${experience.role} at ${experience.company}`)}](${experienceMarkdownHref(experience.slug)}) — ${escapeMdInline(excerpt(experience.txt, 140))} (${escapeMdInline(experience.year)})`;

// Section body lines for one experience type, or an explicit empty marker (never a bare heading).
// The identity default keeps the English-only site index (llms.txt) free of translation wiring.
export const experienceLines = (experienceList: ExperienceList, type: Experience["type"], translate: Translate = (source) => source) =>
  pipe(
    experienceList,
    Array.filter((experience) => experience.type === type),
    Array.map(experienceLine),
    Array.join("\n"),
    (lines) => (lines === "" ? `_${translate(msg("No entries."))}_` : lines)
  );
