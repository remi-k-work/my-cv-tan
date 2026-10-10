// services, features, and other libraries
import { Array, pipe } from "effect";
import { experienceHeadline, excerpt } from "@/features/experience/domain";
import { experienceMarkdownHref } from "@/features/meta/domain";
import { escapeMdInline, mdEmptyMarker } from "./helpers";

// types
import type { Experience, ExperienceList } from "@/features/experience/domain";
import type { PreferredLanguage } from "@/domain";
import type { Translate } from "./models";

// constants
import { LIST_EXCERPT_LENGTH } from "./constants";

// One line per experience in AI indexes: label links the .md twin, excerpt carries the substance
const experienceLine = (experience: Experience, preferredLanguage: PreferredLanguage = "en") =>
  `- [${escapeMdInline(experienceHeadline(experience, preferredLanguage))}](${experienceMarkdownHref(experience.slug)}) — ${escapeMdInline(excerpt(experience.txt, LIST_EXCERPT_LENGTH))} (${escapeMdInline(experience.year)})`;

// Section body lines for one experience type, or an explicit empty marker (never a bare heading)
// The identity default keeps the English-only site index (llms.txt) free of translation wiring
export const experienceLines = (
  experienceList: ExperienceList,
  type: Experience["type"],
  translate: Translate = (source) => source,
  preferredLanguage: PreferredLanguage = "en"
) =>
  pipe(
    experienceList,
    Array.filter((experience) => experience.type === type),
    Array.map((experience) => experienceLine(experience, preferredLanguage)),
    Array.join("\n"),
    (lines) => (lines === "" ? mdEmptyMarker(translate) : lines)
  );
