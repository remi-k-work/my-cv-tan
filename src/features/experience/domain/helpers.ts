// services, features, and other libraries
import { Array, Option, pipe, Result, String } from "effect";
import { matchPreferredLanguage } from "@/domain/helpers";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { Experience, ExperienceList } from "./models";

// constants
import { EXCERPT_SUFFIX } from "./constants";

// Locate one experience by slug inside a decoded list (None = clean 404 candidate);
// shared by the route loaders and the Markdown twins so the lookup can never drift
export const experienceFromList = (experienceList: ExperienceList, slug: string) => Array.findFirst(experienceList, (experience) => experience.slug === slug);

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

// Bounds prose to `maxLength` user-visible characters, preferring the last word boundary so a
// summary never ends mid-word; shared by meta descriptions, JSON-LD, Markdown twins and the slider
export const excerpt = (text: string, maxLength: number) => {
  // Split into code points so the cut below can never fall inside a surrogate pair; `maxLength`
  // counts user-visible characters, matching the unit the typewriter types and deletes in
  const chars = Array.fromIterable(text);

  // Return early if text fits within limits
  if (chars.length <= maxLength) return text;

  // Take the first maxLength characters from the left
  const cut = Array.join(Array.take(chars, maxLength), "");

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
