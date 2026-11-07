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

// Employment or portfolio project — the one kind question the HTML head's article section, the
// JSON-LD subject node, the Markdown twin's fact type and the collection grouping all ask. Reading
// it from one place keeps a second spelling of "e" from labelling the same experience two ways.
export const isEmployment = (experience: Pick<Experience, "type">) => experience.type === "e";

// Localized records share canonical URLs, so every language must publish the same unique slugs.
export const haveSameExperienceSlugs = (left: ReadonlyArray<Pick<Experience, "slug">>, right: ReadonlyArray<Pick<Experience, "slug">>) => {
  const leftSlugs = new Set(left.map(({ slug }) => slug));
  const rightSlugs = new Set(right.map(({ slug }) => slug));

  return left.length === right.length && leftSlugs.size === left.length && rightSlugs.size === right.length && left.every(({ slug }) => rightSlugs.has(slug));
};

// One-pass split of the mixed list into employment ("e") and portfolio projects ("p"):
// the two types are the only kinds of experience, so the split and the `isEmployment`
// predicate above can never disagree; shared so the home sliders, the home JSON-LD
// collections and any future consumer group the two kinds identically
export const partitionExperiences = (experienceList: ExperienceList) =>
  Array.partition(experienceList, (experience) => (isEmployment(experience) ? Result.succeed(experience) : Result.fail(experience)));

// Keep translated headlines consistent across route metadata, JSON-LD, and Markdown twins;
// the language switch delegates to the shared helper so every surface branches the same way
export const experienceHeadline = (experience: Pick<Experience, "type" | "role" | "company">, preferredLanguage: PreferredLanguage) =>
  experience.type === "p"
    ? matchPreferredLanguage(preferredLanguage, experience.role, `Projekt osobisty: ${experience.role}`)
    : matchPreferredLanguage(preferredLanguage, `${experience.role} at ${experience.company}`, `${experience.role} w ${experience.company}`);

// Bounds prose to `maxLength` user-visible characters, preferring the last word boundary so a
// summary never ends mid-word; shared by meta descriptions, JSON-LD, Markdown twins and the slider.
// The truncation suffix is part of the budget, so the returned summary — ellipsis included — never
// exceeds the limit a search engine or social card enforces.
export const excerpt = (text: string, maxLength: number) => {
  // Split into code points so the cut below can never fall inside a surrogate pair; `maxLength`
  // counts user-visible characters, matching the unit the typewriter types and deletes in
  const chars = Array.fromIterable(text);

  // Return early if text fits within limits
  if (chars.length <= maxLength) return text;

  // Reserve room for the suffix so the appended ellipsis cannot push the result past the budget
  const budget = Math.max(0, maxLength - EXCERPT_SUFFIX.length);

  // Take the first `budget` characters from the left
  const cut = Array.join(Array.take(chars, budget), "");

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
