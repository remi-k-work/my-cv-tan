// services, features, and other libraries
import { Array } from "effect";
import { msg } from "gt-tanstack-start";

// types
import type { ExperienceList } from "@/features/experience/domain";
import type { Translate } from "./models";

// Locate one experience by slug inside a decoded list (None = clean 404 candidate);
// the failed-decode case stays an error in the caller via requireData
export const experienceFromList = (experienceList: ExperienceList, slug: string) => Array.findFirst(experienceList, (experience) => experience.slug === slug);

// Honest, parseable unavailable document rather than an HTML error page
export const unavailableMarkdownBody = (translate: Translate) =>
  [
    `# ${translate(msg("Content temporarily unavailable"))}`,
    ``,
    translate(msg("The required portfolio content could not be loaded. Please try again shortly.")),
    ``,
  ].join("\n");
