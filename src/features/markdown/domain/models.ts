// Rendering context and document inputs for Markdown twins.

// types
import type { Option } from "effect";
import type { PageTitles, PreferredLanguage, Translate } from "@/domain/models";
import type { Experience, ExperienceList } from "@/features/experience/domain/models";
import type { EducationList } from "@/features/education/domain/models";

export interface LocalizedMdInput {
  readonly preferredLanguage: PreferredLanguage;
  readonly translate: Translate;
}

// Inputs for static page twin renderers.
export type HomeMdInput = LocalizedMdInput & {
  readonly pageTitles: PageTitles;
  readonly experienceList: ExperienceList;
};

export type EducationMdInput = LocalizedMdInput & {
  readonly pageTitles: PageTitles;
  readonly educationList: EducationList;
};

export type ContactMdInput = LocalizedMdInput & { readonly pageTitles: PageTitles };

export type ExperienceMdInput = LocalizedMdInput & { readonly experience: Experience };

// Input for 404 twin renderer; slug is none when URL contained no valid identifier.
export type BuildNotFoundMdInput = LocalizedMdInput & { readonly slug: Option.Option<string> };

// URL lead style for experience listings: twin endpoint or canonical HTML URL.
export type ExperienceEntryLink = "twin" | "canonical";

// Input for experience section generators in index documents.
export type ExperienceLinesInput = LocalizedMdInput & {
  readonly experienceList: ExperienceList;
  readonly type: Experience["type"];
  readonly entry: ExperienceEntryLink;
};
