// services, features, and other libraries
import { Option, pipe, String } from "effect";
import { matchPreferredLanguage } from "@/domain/helpers";

// types
import type { PreferredLanguage } from "@/domain/models";

// constants
import { EXCERPT_SUFFIX } from "./constants";

// Keep translated headlines consistent across route metadata, JSON-LD, and Markdown twins;
// the language switch delegates to the shared helper so every surface branches the same way
export const experienceHeadline = (
  experience: { readonly type: "e" | "p"; readonly role: string; readonly company: string },
  preferredLanguage: PreferredLanguage
) =>
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
