// services, features, and other libraries
import { Array } from "effect";
import { matchPreferredLanguage } from "@/domain";

// types
import type { PreferredLanguage } from "@/domain";
import type { ExperienceList } from "@/features/experience/domain";

// Locate one experience by slug inside a decoded list (None = clean 404 candidate);
// the failed-decode case stays an error in the caller via requireData
export const experienceFromList = (experienceList: ExperienceList, slug: string) => Array.findFirst(experienceList, (experience) => experience.slug === slug);

// Honest, parseable unavailable document rather than an HTML error page
export const unavailableMarkdownBody = (preferredLanguage: PreferredLanguage) =>
  [
    `# ${matchPreferredLanguage(preferredLanguage, "Content temporarily unavailable", "Treść jest tymczasowo niedostępna")}`,
    ``,
    matchPreferredLanguage(
      preferredLanguage,
      "The required portfolio content could not be loaded. Please try again shortly.",
      "Nie udało się wczytać wymaganej treści portfolio. Spróbuj ponownie za chwilę."
    ),
    ``,
  ].join("\n");
