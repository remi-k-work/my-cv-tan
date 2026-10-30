// services, features, and other libraries
import { Option, Predicate, Record, pipe } from "effect";
import { getTranslationsSnapshot } from "gt-tanstack-start";
import { hashSource } from "generaltranslation/id";
import { preferredLanguageFromLocale } from "@/domain/helpers";

// types
import type { PreferredLanguage, Translate } from "@/domain/models";

// An explicit map of allowed dictionaries: each import stays statically analyzable, so the
// bundler knows exactly which locale files exist instead of widening the glob to the folder
const TRANSLATION_LOADERS = {
  en: () => import("../_gt/en.json"),
  pl: () => import("../_gt/pl.json"),
} as const;

export async function loadTranslations(locale: string): Promise<unknown> {
  return (await TRANSLATION_LOADERS[preferredLanguageFromLocale(locale)]()).default;
}

// A sync translate function bound to one explicit language. getGT() follows the request
// locale, so for a ?lang= override we read the language's local snapshot directly: hash
// the source string (ICU, as gt() does at runtime) and look it up in the loaded dictionary
export const translateForLanguage = async (preferredLanguage: PreferredLanguage): Promise<Translate> => {
  // getTranslationsSnapshot() omits the locale entirely when its loader fails, so the
  // dictionary itself is optional — hence Option.fromNullishOr rather than a raw lookup,
  // which would throw on the missing entry
  const translations = Option.fromNullishOr((await getTranslationsSnapshot(preferredLanguage))[preferredLanguage]);

  return (source: string): string =>
    pipe(
      translations,
      Option.flatMap((dictionary) => Record.get(dictionary, hashSource({ source, dataFormat: "ICU" }))),
      Option.filter(Predicate.isString),
      Option.getOrElse(() => source)
    );
};
