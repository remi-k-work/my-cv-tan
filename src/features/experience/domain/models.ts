// services, features, and other libraries
import { Schema } from "effect";

// types
export type Experience = typeof Experience.Type;
export type ExperienceList = typeof ExperienceList.Type;

// Root-level route names cannot be experience slugs, and a `.md` suffix would make an HTML
// canonical resolve to the Markdown twin of a shorter slug.
const ExperienceSlug = Schema.Trim.check(
  Schema.isNonEmpty(),
  Schema.isPattern(/^(?!\.{1,2}$)[\s\S]+$/u),
  Schema.isPattern(/^[^\uD800-\uDFFF]+$/u),
  Schema.isPattern(/^(?![\s\S]*\.md$)[\s\S]+$/iu),
  // Static pages and the legacy redirect outrank the dynamic detail route.
  Schema.isPattern(/^(?!(?:education|contact|exp)$)[\s\S]+$/iu),
  // These discovery documents occupy root-level paths.
  Schema.isPattern(/^(?!(?:llms(?:-full)?\.txt|robots\.txt|sitemap\.xml)$)[\s\S]+$/iu)
);

export const Experience = Schema.Struct({
  type: Schema.Literals(["e", "p"]),
  slug: ExperienceSlug,
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
