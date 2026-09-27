// services, features, and other libraries
import { Schema } from "effect";

// types
export type PreferredLanguage = typeof PreferredLanguage.Type;
export type PagePath = typeof PagePath.Type;
export type PageTitles = typeof PageTitles.Type;
export type PageTitlesList = typeof PageTitlesList.Type;
export type LocalizedContent = typeof LocalizedContent.Type;
export type Experience = typeof Experience.Type;
export type ExperienceList = typeof ExperienceList.Type;
export type EducationList = typeof EducationList.Type;

export const PreferredLanguage = Schema.Literals(["en", "pl"]);

const PagePath = Schema.Literals(["/", "/education", "/contact"]);
const PageTitle = Schema.Struct({
  eyebrow: Schema.Trim.check(Schema.isNonEmpty()),
  heading: Schema.Trim.check(Schema.isNonEmpty()),
  intro: Schema.Trim.check(Schema.isNonEmpty()),
});
export const PageTitles = Schema.Record(PagePath, PageTitle);
export const PageTitlesList = Schema.Array(PageTitles);

const LocalizedSection = Schema.Trim.check(Schema.isNonEmpty());
const LocalizedKey = Schema.Trim.check(Schema.isNonEmpty());
const LocalizedValue = Schema.Trim.check(Schema.isNonEmpty());
export const LocalizedContent = Schema.Record(LocalizedSection, Schema.Record(LocalizedKey, LocalizedValue));

export const Experience = Schema.Struct({
  type: Schema.Literals(["e", "p"]),
  slug: Schema.Trim.check(Schema.isNonEmpty()),
  year: Schema.Trim.check(Schema.isNonEmpty()),
  role: Schema.Trim.check(Schema.isNonEmpty()),
  company: Schema.Trim.check(Schema.isNonEmpty()),
  txt: Schema.Trim.check(Schema.isNonEmpty()),
  gitHubLink: Schema.optionalKey(Schema.Trim.check(Schema.isNonEmpty())),
  liveLink: Schema.optionalKey(Schema.Trim.check(Schema.isNonEmpty())),
  videoLink: Schema.optionalKey(Schema.Trim.check(Schema.isNonEmpty())),
  imageName: Schema.Trim.check(Schema.isNonEmpty()),
  skillsUsed: Schema.NonEmptyArray(Schema.Trim.check(Schema.isNonEmpty())),
});
export const ExperienceList = Schema.Array(Experience);

const Education = Schema.Struct({
  name: Schema.Trim.check(Schema.isNonEmpty()),
  year: Schema.Trim.check(Schema.isNonEmpty()),
  location: Schema.Trim.check(Schema.isNonEmpty()),
  info: Schema.Trim.check(Schema.isNonEmpty()),
});
export const EducationList = Schema.Array(Education);
