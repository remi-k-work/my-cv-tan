// services, features, and other libraries
import { Effect, Schema } from "effect";
import { getMessagesInternal } from "gt-i18n/internal";
import { preferredLanguageFromLocale } from "@/domain/helpers";

// types
import type { PreferredLanguage, Translate } from "@/domain/models";

// An explicit map of allowed dictionaries: each import stays statically analyzable, so the
// bundler knows exactly which locale files exist instead of widening the glob to the folder
const TRANSLATION_LOADERS = {
  en: () => import("../_gt/en.json"),
  pl: () => import("../_gt/pl.json"),
} as const;

const TranslationDictionary = Schema.Record(Schema.String, Schema.String);
const decodeTranslationDictionary = Schema.decodeUnknownSync(TranslationDictionary);

// The loader GT's translation cache reads a locale through. The committed dictionaries are the
// single source of copy; GT owns hashing and lookup, so this module never re-implements them
export async function loadTranslations(locale: string) {
  return decodeTranslationDictionary((await TRANSLATION_LOADERS[preferredLanguageFromLocale(locale)]()).default);
}

// A sync translate function bound to one explicit language. getGT()/getMessages() follow the
// request locale through the condition store, which a ?lang= override must not depend on, so the
// condition-store-agnostic resolver reads the msg()-registered sources for the requested language
export const translateForLanguage = (preferredLanguage: PreferredLanguage) =>
  Effect.tryPromise(() => getMessagesInternal({ locale: preferredLanguage, enableI18n: true })).pipe(
    Effect.map(
      (m): Translate =>
        (source) =>
          m(source)
    )
  );
