// services, features, and other libraries
import { Schema } from "effect";

// types
export type PreferredLanguage = typeof PreferredLanguage.Type;
export type PagePath = typeof PagePath.Type;
export type PageTitlesList = typeof PageTitlesList.Type;
export type LocalizedContent = typeof LocalizedContent.Type;
export type ExperienceList = typeof ExperienceList.Type;
export type EducationList = typeof EducationList.Type;

export const PreferredLanguage = Schema.Literals(["en", "pl"]);

const PagePath = Schema.Literals(["/", "/education", "/contact"]);
class PageTitle extends Schema.Class<PageTitle>("PageTitle")({
  eyebrow: Schema.Trim.check(Schema.isNonEmpty()),
  heading: Schema.Trim.check(Schema.isNonEmpty()),
  intro: Schema.Trim.check(Schema.isNonEmpty()),
}) {}
const PageTitles = Schema.Record(PagePath, PageTitle);
export const PageTitlesList = Schema.NonEmptyArray(PageTitles);

const LocalizedSection = Schema.Trim.check(Schema.isNonEmpty());
const LocalizedKey = Schema.Trim.check(Schema.isNonEmpty());
const LocalizedValue = Schema.Trim.check(Schema.isNonEmpty());
export const LocalizedContent = Schema.Record(LocalizedSection, Schema.Record(LocalizedKey, LocalizedValue));

export class Experience extends Schema.Class<Experience>("Experience")({
  type: Schema.Literals(["e", "p"]),
  slug: Schema.Trim.check(Schema.isNonEmpty()),
  year: Schema.Trim.check(Schema.isNonEmpty()),
  role: Schema.Trim.check(Schema.isNonEmpty()),
  company: Schema.Trim.check(Schema.isNonEmpty()),
  txt: Schema.Trim.check(Schema.isNonEmpty()),
  gitHubLink: Schema.optionalKey(Schema.Trim.check(Schema.isNonEmpty())),
  liveLink: Schema.optionalKey(Schema.Trim.check(Schema.isNonEmpty())),
  videoLink: Schema.optionalKey(Schema.Trim.check(Schema.isNonEmpty())),
  imageName: Schema.FiniteFromString.check(Schema.isInt()),
  skillsUsed: Schema.NonEmptyArray(Schema.Trim.check(Schema.isNonEmpty())),
}) {}
export const ExperienceList = Schema.NonEmptyArray(Experience);

class Education extends Schema.Class<Education>("Education")({
  name: Schema.Trim.check(Schema.isNonEmpty()),
  year: Schema.Trim.check(Schema.isNonEmpty()),
  location: Schema.Trim.check(Schema.isNonEmpty()),
  info: Schema.Trim.check(Schema.isNonEmpty()),
}) {}
export const EducationList = Schema.NonEmptyArray(Education);
