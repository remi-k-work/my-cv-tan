// services, features, and other libraries
import type { Effect, Option } from "effect";

// types
import type { PagePath, PageTitles, PreferredLanguage, Translate } from "@/domain/models";
import type { RequiredDataError } from "@/features/data/domain/required";
import type { DatasetsService } from "@/features/data/services/datasets";
import type { EducationList } from "@/features/education/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { ExperienceSeo } from "@/features/meta/domain/models";

// A Markdown twin consists of structured frontmatter facts and a markdown body.
export interface MarkdownTwin {
  readonly facts: Readonly<Record<string, string>>;
  readonly body: string;
}

export interface LocalizedMdInput {
  readonly preferredLanguage: PreferredLanguage;
  readonly translate: Translate;
}

export interface ExperienceMdInput {
  readonly seo: ExperienceSeo;
  readonly translate: Translate;
}

export interface ExperienceLinesInput extends LocalizedMdInput {
  readonly experiences: ExperienceList;
  readonly entry: "twin" | "canonical";
}

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

export type HomeMdInput = LocalizedMdInput & HomeTwinData;
export type EducationMdInput = LocalizedMdInput & EducationTwinData;
export type ContactMdInput = LocalizedMdInput & ContactTwinData;

export interface NotFoundMdInput extends LocalizedMdInput {
  readonly slug: Option.Option<string>;
}

export type TwinData = HomeTwinData & EducationTwinData;
export type TwinDataResolver<Data> = (datasets: DatasetsService, preferredLanguage: PreferredLanguage) => Effect.Effect<Data, RequiredDataError>;

export interface PageTwin<Data> {
  readonly pagePath: PagePath;
  readonly mdHref: string;
  readonly name: string;
  readonly summary: string;
  readonly canonical: string;
  readonly resolveData: TwinDataResolver<Data>;
  readonly render: (data: Data, context: LocalizedMdInput) => MarkdownTwin;
}

export interface TwinEntry {
  readonly name: string;
  readonly canonical: string;
  readonly twinUrl: string;
  readonly summary?: string;
  readonly render: (data: TwinData) => MarkdownTwin;
}

export type TwinEntrySpec = Omit<TwinEntry, "twinUrl"> & { readonly mdHref: string };
