// services, features, and other libraries
import { Schema } from "effect";

// types
export type PreferredLanguage = typeof PreferredLanguage.Type;
export type PagePath = typeof PagePath.Type;
export type PageTitles = typeof PageTitles.Type;
export type PageTitlesList = typeof PageTitlesList.Type;

export const PreferredLanguage = Schema.Literals(["en", "pl"]);

const PagePath = Schema.Literals(["/", "/education", "/contact"]);
const PageTitle = Schema.Struct({
  eyebrow: Schema.Trim.check(Schema.isNonEmpty()),
  heading: Schema.Trim.check(Schema.isNonEmpty()),
  intro: Schema.Trim.check(Schema.isNonEmpty()),
});
export const PageTitles = Schema.Record(PagePath, PageTitle);
export const PageTitlesList = Schema.Array(PageTitles);
