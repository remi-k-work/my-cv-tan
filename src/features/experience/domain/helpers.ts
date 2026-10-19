// services, features, and other libraries
import { Array, Option, pipe, Result, String } from "effect";
import { matchPreferredLanguage } from "@/domain/helpers";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { Experience, ExperienceList } from "./models";

// constants
import { EXCERPT_SUFFIX } from "./constants";

// One-pass split of the mixed list into employment ("e") and portfolio projects ("p"):
// "e" and "p" are the only experience types, so whatever is not employment is exactly
// the project list. Shared so the home sliders, the home JSON-LD collections and any
// future consumer group the two kinds identically and can never drift apart
export const partitionExperiences = (experienceList: ExperienceList) =>
  Array.partition(experienceList, (experience) => (experience.type === "e" ? Result.succeed(experience) : Result.fail(experience)));

// Keep translated headlines consistent across route metadata, JSON-LD, and Markdown twins;
// the language switch delegates to the shared helper so every surface branches the same way
export const experienceHeadline = (experience: Pick<Experience, "type" | "role" | "company">, preferredLanguage: PreferredLanguage) =>
  experience.type === "p"
    ? matchPreferredLanguage(preferredLanguage, experience.role, `Projekt osobisty: ${experience.role}`)
    : matchPreferredLanguage(preferredLanguage, `${experience.role} at ${experience.company}`, `${experience.role} w ${experience.company}`);

export const excerpt = (text: string, maxLength: number) => {
  // Return early if text fits within limits
  if (String.length(text) <= maxLength) return text;

  // Take the first maxLength characters from the left
  const cut = pipe(text, String.takeLeft(maxLength));

  // Find last word boundary using Option
  const wordBoundedText = pipe(
    cut,
    String.lastIndexOf(" "),
    Option.filter((index) => index > 0),
    Option.map((index) => pipe(cut, String.takeLeft(index))),
    Option.getOrElse(() => cut)
  );

  return `${String.trimEnd(wordBoundedText)}${EXCERPT_SUFFIX}`;
};
