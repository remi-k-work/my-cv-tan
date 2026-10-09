// services, features, and other libraries
import { Array, pipe } from "effect";
import { excerpt } from "@/features/experience/domain";
import { experienceMarkdownHref } from "@/features/meta/domain";
import { escapeMdInline, mdEmptyMarker } from "./helpers";

// types
import type { Experience, ExperienceList } from "@/features/experience/domain";
import type { Translate } from "./models";

// constants
import { LIST_EXCERPT_LENGTH } from "./constants";

// One line per experience in AI indexes: label links the .md twin, excerpt carries the substance
export const experienceLine = (experience: Experience) =>
  `- [${escapeMdInline(`${experience.role} at ${experience.company}`)}](${experienceMarkdownHref(experience.slug)}) — ${escapeMdInline(excerpt(experience.txt, LIST_EXCERPT_LENGTH))} (${escapeMdInline(experience.year)})`;

// Section body lines for one experience type, or an explicit empty marker (never a bare heading).
// The identity default keeps the English-only site index (llms.txt) free of translation wiring.
export const experienceLines = (experienceList: ExperienceList, type: Experience["type"], translate: Translate = (source) => source) =>
  pipe(
    experienceList,
    Array.filter((experience) => experience.type === type),
    Array.map(experienceLine),
    Array.join("\n"),
    (lines) => (lines === "" ? mdEmptyMarker(translate) : lines)
  );
