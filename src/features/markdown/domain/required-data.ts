// services, features, and other libraries
import { Array, Effect, Option, pipe } from "effect";
import { requireData, RequiredDataError } from "@/features/data/domain";
import { mdLabel } from "./helpers";

// types
import type { PreferredLanguage } from "@/domain";
import type { Experience, ExperienceList } from "@/features/experience/domain";

export { requireData, RequiredDataError };

// A failed list decode remains an error, while a valid list without a slug is a 404.
export const experienceFromList = Effect.fnUntraced(function* (
  experienceList: Option.Option<ExperienceList>,
  slug: string
): Effect.fn.Return<Option.Option<Experience>, RequiredDataError> {
  const experiences = yield* requireData(experienceList, "experience list");
  return pipe(experiences, Array.findFirst((experience) => experience.slug === slug));
});

export const unavailableMarkdownBody = (preferredLanguage: PreferredLanguage) =>
  [
    `# ${mdLabel(preferredLanguage, "Content temporarily unavailable", "Treść jest tymczasowo niedostępna")}`,
    ``,
    mdLabel(
      preferredLanguage,
      "The required portfolio content could not be loaded. Please try again shortly.",
      "Nie udało się wczytać wymaganej treści portfolio. Spróbuj ponownie za chwilę."
    ),
    ``,
  ].join("\n");
