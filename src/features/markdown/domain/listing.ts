// services, features, and other libraries
import { Array, pipe, Result } from "effect";
import { experienceHeadline, excerpt } from "@/features/experience/domain/helpers";
import { experienceMarkdownHref } from "@/features/meta/domain/url";
import { escapeMdInline, mdEmptyMarker, translateSource } from "./helpers";

// types
import type { ExperienceLinesInput } from "./models";

// constants
import { LIST_EXCERPT_LENGTH } from "./constants";

// Section body lines for one experience type, or an explicit empty marker (never a bare heading)
export const experienceLines = ({ experienceList, type, translate = translateSource, preferredLanguage = "en" }: ExperienceLinesInput) =>
  pipe(
    experienceList,
    // Filter and format in one pass: only this experience type contributes a line
    Array.filterMap((experience) =>
      experience.type === type
        ? // One line per experience in AI indexes: label links the .md twin, excerpt carries the substance
          Result.succeed(
            `- [${escapeMdInline(experienceHeadline(experience, preferredLanguage))}](${experienceMarkdownHref(experience.slug)}) — ${escapeMdInline(excerpt(experience.txt, LIST_EXCERPT_LENGTH))} (${escapeMdInline(experience.year)})`
          )
        : Result.failVoid
    ),
    Array.join("\n"),
    (lines) => (lines === "" ? mdEmptyMarker(translate) : lines)
  );
