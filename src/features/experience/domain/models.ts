// services, features, and other libraries
import { Option, Schema } from "effect";

// types
import type { ImageFacts, PreferredLanguage } from "@/domain/models";

// types
export type Experience = typeof Experience.Type;
export type ExperienceList = typeof ExperienceList.Type;
export type ExperienceSection = "employment" | "portfolio";

// Root-level route names cannot be experience slugs, and a `.md` suffix would make an HTML
// canonical resolve to the Markdown twin of a shorter slug
const ExperienceSlug = Schema.Trim.check(
  Schema.isNonEmpty(),
  Schema.isPattern(/^(?!\.{1,2}$)[\s\S]+$/u),
  Schema.isPattern(/^[^\uD800-\uDFFF]+$/u),
  Schema.isPattern(/^(?![\s\S]*\.md$)[\s\S]+$/iu),
  // Static pages and the legacy redirect outrank the dynamic detail route
  Schema.isPattern(/^(?!(?:index|education|contact|exp)$)[\s\S]+$/iu),
  // Discovery documents occupy root-level paths
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
  imageName: Schema.Trim.check(Schema.isNonEmpty(), Schema.isPattern(/^[^\uD800-\uDFFF]+$/u)),
  skillsUsed: Schema.NonEmptyArray(Schema.Trim.check(Schema.isNonEmpty())),
});
export const ExperienceList = Schema.Array(Experience);

// Shared input for the identity, content and head projections
export interface ExperienceIdentityInput {
  readonly experience: Experience;
  readonly preferredLanguage: PreferredLanguage;
}

// Identity shared by every experience representation, including projections that do not need a
// description or image and should not process the full narrative
export interface ExperienceIdentity {
  readonly preferredLanguage: PreferredLanguage;
  readonly path: string;
  readonly canonical: string;
  readonly markdownPath: string;
  readonly headline: string;
}

// Full detail projections add narrative and image facts to the lightweight identity
export interface ExperienceSeo extends ExperienceIdentity {
  readonly experience: Experience;
  readonly description: string;
  readonly screenshot: Option.Option<ImageFacts>;
}
