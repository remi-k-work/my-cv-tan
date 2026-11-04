// Strongly-typed contracts and data models for Markdown twins and AI discovery documents.

// services, features, and other libraries
import type { Effect, Option } from "effect";

// types
import type { PagePath, PageTitles, PreferredLanguage, Translate } from "@/domain/models";
import type { DatasetsService } from "@/features/data/services/datasets";
import type { RequiredDataError } from "@/features/data/domain/required";
import type { EducationList } from "@/features/education/domain/models";
import type { Experience, ExperienceList } from "@/features/experience/domain/models";

// Rendering context shared by every Markdown twin builder.
export interface LocalizedMdInput {
  readonly preferredLanguage: PreferredLanguage;
  readonly translate: Translate;
}

// URL lead style for experience listings: twin endpoint or canonical HTML URL.
export type ExperienceEntryLink = "twin" | "canonical";

export interface ExperienceMdInput extends LocalizedMdInput {
  readonly experience: Experience;
}

export interface ExperienceLinesInput extends LocalizedMdInput {
  readonly experienceList: ExperienceList;
  readonly type: Experience["type"];
  readonly entry: ExperienceEntryLink;
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

// Aggregated portfolio datasets required for full-site rendering.
export interface TwinData {
  readonly pageTitles: PageTitles;
  readonly experienceList: ExperienceList;
  readonly educationList: EducationList;
}

// Specification for a static page markdown twin.
export interface PageTwin<Data> {
  readonly pagePath: PagePath;
  readonly mdHref: string;
  readonly name: string;
  readonly summary: string;
  readonly resolve: (datasets: DatasetsService, preferredLanguage: PreferredLanguage) => Effect.Effect<Data, RequiredDataError>;
  readonly render: (pageTitles: PageTitles, data: Data, context: LocalizedMdInput) => string;
}

// Published entry in machine-readable index documents (llms.txt / llms-full.txt).
export interface TwinEntry {
  readonly name: string;
  readonly canonical: string;
  readonly twinUrl: string;
  readonly summary?: string;
  readonly render: (data: TwinData) => string;
}

// HTTP pipeline contracts for machine document endpoints.
export type MachineDocumentBody = (request: Request, context: LocalizedMdInput) => Effect.Effect<Response, RequiredDataError>;
export type MachineDocument = (request: Request) => Effect.Effect<Response, never>;
