// services, features, and other libraries
import { Schema } from "effect";

// types
export type Experience = typeof Experience.Type;
export type ExperienceList = typeof ExperienceList.Type;

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
