// services, features, and other libraries
import { Schema } from "effect";

// types
export type PreferredLanguage = typeof PreferredLanguage.Type;
export type PagePath = typeof PagePath.Type;
export type PageTitles = typeof PageTitles.Type;
export type PageTitlesList = typeof PageTitlesList.Type;

// Resolves a msg()-registered source string into the requested language; injected so the
// pure builders stay testable while the service decides where translations come from
export type Translate = (source: string) => string;

// constants
import { CONTACT_PATH, EDUCATION_PATH, HOME_PATH, SITE_LANGUAGES } from "./constants";

export const PreferredLanguage = Schema.Literals(SITE_LANGUAGES);

// The route list above is the vocabulary, so a path the schema accepted but no constant names
// would be a page no surface could address.
const PagePath = Schema.Literals([HOME_PATH, EDUCATION_PATH, CONTACT_PATH]);
const PageTitle = Schema.Struct({
  eyebrow: Schema.Trim.check(Schema.isNonEmpty()),
  heading: Schema.Trim.check(Schema.isNonEmpty()),
  intro: Schema.Trim.check(Schema.isNonEmpty()),
});
export const PageTitles = Schema.Record(PagePath, PageTitle);
export const PageTitlesList = Schema.Array(PageTitles);
