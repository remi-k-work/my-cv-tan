// services, features, and other libraries
import { getTranslationsSnapshot } from "gt-tanstack-start";
import { hashSource } from "generaltranslation/id";

// types
import type { PreferredLanguage } from "@/domain";

export async function loadTranslations(locale: string): Promise<unknown> {
  return (await import(`../_gt/${locale}.json`)).default;
}

// A sync translate function bound to one explicit language. getGT() follows the request
// locale, so for a ?lang= override we read the language's local snapshot directly: hash
// the source string (ICU, as gt() does at runtime) and look it up in the loaded dictionary.
export const translateForLanguage = async (preferredLanguage: PreferredLanguage): Promise<(source: string) => string> => {
  const translations = (await getTranslationsSnapshot(preferredLanguage))[preferredLanguage];
  return (source: string): string => {
    const translation = translations[hashSource({ source, dataFormat: "ICU" })];
    return typeof translation === "string" ? translation : source;
  };
};
