// Twin model types shared by every Markdown twin builder.

// services, features, and other libraries
import type { Effect, Option } from "effect";

// types
import type { PagePath, PageTitles, PreferredLanguage, Translate } from "@/domain/models";
import type { RequiredDataError } from "@/features/data/domain/required";
import type { DatasetsService } from "@/features/data/services/datasets";
import type { EducationList } from "@/features/education/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { ExperienceSeo } from "@/features/meta/domain/experience-seo";

// --- Twin models ---

// A twin in two parts: the identity facts every surface restates, and the body. They stay apart
// because the two publishings of a twin need them apart — the served twin carries the facts as
// YAML frontmatter above the body, while the concatenated companion republishes them fenced,
// because a raw `---` block inside a document is not frontmatter: it parses as a thematic break,
// and its closing line, sitting directly under the last fact, turns that fact into a setext
// heading at the same depth as the companion's own section headings.
export interface MarkdownTwin {
  readonly facts: Readonly<Record<string, string>>;
  readonly body: string;
}

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
  // One kind of experience, already split off the list by the caller. A document that prints both
  // kinds therefore partitions once, and the two listings cannot group an experience differently.
  readonly experiences: ExperienceList;
  // URL lead style for the listing line: twin endpoint or canonical HTML URL.
  readonly entry: "twin" | "canonical";
}

// --- Static twin datasets ---

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

// --- Static twin inputs ---

// Each static twin input is the rendering context plus the bundle its render declares, so a bundle
// added to one twin is the bundle its resolver and index entry read too.
export type HomeMdInput = LocalizedMdInput & HomeTwinData;
export type EducationMdInput = LocalizedMdInput & EducationTwinData;
export type ContactMdInput = LocalizedMdInput & ContactTwinData;

// --- Not-found twin ---

export interface NotFoundMdInput extends LocalizedMdInput {
  readonly slug: Option.Option<string>;
}

// Aggregated portfolio datasets required for full-site rendering: exactly what every static twin's
// bundle adds up to.
export type TwinData = HomeTwinData & EducationTwinData;

// Reads the dataset bundle a twin declares off the site's localized dataset vocabulary. The bundle a
// render reads and the bundle the route resolves are the same type, so a twin cannot declare one set
// of dependencies and resolve another.
export type TwinDataResolver<Data> = (datasets: DatasetsService, preferredLanguage: PreferredLanguage) => Effect.Effect<Data, RequiredDataError>;

// Specification for a static page markdown twin: what it reads, how it renders and how it is
// advertised, in one record. `Data` is one of the named bundles above, so the twin, its resolver and
// its index entry cannot each name a different set of dependencies.
export interface PageTwin<Data> {
  readonly pagePath: PagePath;
  readonly mdHref: string;
  // The twin's display name, single-sourced from the static page catalogue every surface walks.
  readonly name: string;
  readonly summary: string;
  readonly canonical: string;
  readonly resolveData: TwinDataResolver<Data>;
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
