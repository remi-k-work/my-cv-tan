// services, features, and other libraries
import { Predicate } from "effect";
import { getTranslationsSnapshot } from "gt-tanstack-start";
import { hashSource } from "generaltranslation/id";

// types
import type { PreferredLanguage, Translate } from "@/domain/models";

// An explicit map of allowed dictionaries: each import stays statically analyzable, so the
// bundler knows exactly which locale files exist instead of widening the glob to the folder
const TRANSLATION_LOADERS = {
  en: () => import("../_gt/en.json"),
  pl: () => import("../_gt/pl.json"),
} as const;

export async function loadTranslations(locale: string): Promise<unknown> {
  const load = TRANSLATION_LOADERS[locale === "pl" ? "pl" : "en"];
  return (await load()).default;
}

// A sync translate function bound to one explicit language. getGT() follows the request
// locale, so for a ?lang= override we read the language's local snapshot directly: hash
// the source string (ICU, as gt() does at runtime) and look it up in the loaded dictionary
export const translateForLanguage = async (preferredLanguage: PreferredLanguage): Promise<Translate> => {
  const translations = (await getTranslationsSnapshot(preferredLanguage))[preferredLanguage];
  return (source: string): string => {
    const translation: unknown = translations[hashSource({ source, dataFormat: "ICU" })];
    return Predicate.isString(translation) ? translation : source;
  };
};
