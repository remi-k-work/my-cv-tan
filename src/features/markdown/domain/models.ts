// Twin model types shared by every Markdown twin builder.

// services, features, and other libraries
import type { Option } from "effect";

// types
import type { PagePath, PageTitles, PreferredLanguage, Translate } from "@/domain/models";
import type { EducationList } from "@/features/education/domain/models";
import type { Experience, ExperienceList } from "@/features/experience/domain/models";
import type { ExperienceSeo } from "@/features/meta/domain/experience-seo";
import type { MarkdownTwin } from "./format";

// --- Twin models ---

// Rendering context shared by every Markdown twin builder.
export interface LocalizedMdInput {
  readonly preferredLanguage: PreferredLanguage;
  readonly translate: Translate;
}

// The detail twin reads the one published SEO record rather than re-deriving the identity its
// frontmatter and the response envelope both restate, so the two surfaces cannot spell two
// addresses for the same page.
export interface ExperienceMdInput {
  readonly seo: ExperienceSeo;
  readonly translate: Translate;
}

export interface ExperienceLinesInput extends LocalizedMdInput {
  readonly experienceList: ExperienceList;
  readonly type: Experience["type"];
  // URL lead style for the listing line: twin endpoint or canonical HTML URL.
  readonly entry: "twin" | "canonical";
}

export interface HomeMdInput extends LocalizedMdInput {
  readonly pageTitles: PageTitles;
  readonly experienceList: ExperienceList;
}

export interface EducationMdInput extends LocalizedMdInput {
  readonly pageTitles: PageTitles;
  readonly educationList: EducationList;
}

export interface ContactMdInput extends LocalizedMdInput {
  readonly pageTitles: PageTitles;
}

export interface NotFoundMdInput extends LocalizedMdInput {
  readonly slug: Option.Option<string>;
}

// The dataset bundle each static twin reads, declared once so the twin, its resolver and its index
// entry all name the same dependencies — a twin that reads no portfolio data is a type, not a
// convention.
export interface HomeTwinData {
  readonly pageTitles: PageTitles;
  readonly experienceList: ExperienceList;
}

export interface EducationTwinData {
  readonly pageTitles: PageTitles;
  readonly educationList: EducationList;
}

export interface ContactTwinData {
  readonly pageTitles: PageTitles;
}

// Aggregated portfolio datasets required for full-site rendering: exactly what every static twin's
// bundle adds up to.
export interface TwinData extends HomeTwinData, EducationTwinData {}

// Specification for a static page markdown twin. `Data` is one of the named bundles above, so the
// twin, its resolver and its index entry all read the same declared dependencies.
export interface PageTwin<Data> {
  readonly pagePath: PagePath;
  readonly mdHref: string;
  // The twin's display name, single-sourced from the static page catalogue every surface walks.
  readonly name: string;
  readonly summary: string;
  readonly canonical: string;
  readonly render: (data: Data, context: LocalizedMdInput) => MarkdownTwin;
}

// Published entry in machine-readable index documents (llms.txt / llms-full.txt). Both documents
// are the site's one English copy, so the render reads the site-wide bundle; a detail entry derives
// its own record from the experience it names and reads none of it.
export interface TwinEntry {
  readonly name: string;
  readonly canonical: string;
  readonly twinUrl: string;
  readonly summary?: string;
  readonly render: (data: TwinData) => MarkdownTwin;
}
