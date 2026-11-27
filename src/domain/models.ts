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

// Written facts about a published image. Shared by social cards, JSON-LD and the sitemap so every
// surface describes the same file with the same dimensions and MIME type
export interface ImageFacts {
  readonly src: string;
  readonly mime: "image/jpeg" | "image/webp";
  readonly width: number;
  readonly height: number;
}

// The identity every published page's surfaces must agree on: one unbranded title, one description,
// one canonical URL and one language. HTML heads brand the title, Markdown frontmatter serializes
// it, and JSON-LD cites the same canonical URL and description, so the surfaces cannot drift.
export interface PageIdentity {
  readonly title: string;
  readonly description: string;
  readonly canonical: string;
  readonly preferredLanguage: PreferredLanguage;
}

// constants
import { CONTACT_PATH, EDUCATION_PATH, HOME_PATH, SITE_LANGUAGES } from "./constants";

export const PreferredLanguage = Schema.Literals(SITE_LANGUAGES);
export const decodePreferredLanguage = Schema.decodeUnknownOption(PreferredLanguage);

// The route list above is the vocabulary, so a path the schema accepted but no constant names
// would be a page no surface could address
const PagePath = Schema.Literals([HOME_PATH, EDUCATION_PATH, CONTACT_PATH]);
const PageTitle = Schema.Struct({
  eyebrow: Schema.Trim.check(Schema.isNonEmpty()),
  heading: Schema.Trim.check(Schema.isNonEmpty()),
  intro: Schema.Trim.check(Schema.isNonEmpty()),
});

export const PageTitles = Schema.Record(PagePath, PageTitle);
export const PageTitlesList = Schema.Array(PageTitles);
