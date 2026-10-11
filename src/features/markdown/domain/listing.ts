// services, features, and other libraries
import { Array, pipe } from "effect";
import { experienceHeadline, excerpt } from "@/features/experience/domain";
import { experienceMarkdownHref } from "@/features/meta/domain";
import { escapeMdInline, mdEmptyMarker, translateSource } from "./helpers";

// types
import type { ExperienceLinesInput } from "./models";

// constants
import { LIST_EXCERPT_LENGTH } from "./constants";

// Section body lines for one experience type, or an explicit empty marker (never a bare heading)
export const experienceLines = ({ experienceList, type, translate = translateSource, preferredLanguage = "en" }: ExperienceLinesInput) =>
  pipe(
    experienceList,
    Array.filter((experience) => experience.type === type),
    // One line per experience in AI indexes: label links the .md twin, excerpt carries the substance
    Array.map(
      (experience) =>
        `- [${escapeMdInline(experienceHeadline(experience, preferredLanguage))}](${experienceMarkdownHref(experience.slug)}) — ${escapeMdInline(excerpt(experience.txt, LIST_EXCERPT_LENGTH))} (${escapeMdInline(experience.year)})`
    ),
    Array.join("\n"),
    (lines) => (lines === "" ? mdEmptyMarker(translate) : lines)
  );
