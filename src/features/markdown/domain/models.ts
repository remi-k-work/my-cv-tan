// types
import type { PageTitles, PreferredLanguage, Translate } from "@/domain/models";
import type { Experience, ExperienceList } from "@/features/experience/domain/models";
import type { EducationList } from "@/features/education/domain/models";

// translate is injected so the pure builders stay testable; the service decides where translations come from

// Shared tail of every twin input: the resolved language plus its translate injection
interface LocalizedMdInput {
  readonly preferredLanguage: PreferredLanguage;
  readonly translate: Translate;
}

// Static-page twins read the same stable page copy the HTML head resolves from
interface PageMdInput extends LocalizedMdInput {
  readonly pageTitles: PageTitles;
}

export interface HomeMdInput extends PageMdInput {
  readonly experienceList: ExperienceList;
}

export interface EducationMdInput extends PageMdInput {
  readonly educationList: EducationList;
}

export type ContactMdInput = PageMdInput;

export interface ExperienceMdInput extends LocalizedMdInput {
  readonly experience: Experience;
}

export interface BuildNotFoundMdInput extends LocalizedMdInput {
  readonly slug: string;
}

// Everything the single-request full-content index (llms-full.txt) renders from
export interface LlmsFullInput {
  readonly pageTitles: PageTitles;
  readonly experienceList: ExperienceList;
  readonly educationList: EducationList;
}

// One experience section in an AI index; translate and language default to English source
// copy inside listing.ts so the English-only indexes stay free of translation wiring
export interface ExperienceLinesInput {
  readonly experienceList: ExperienceList;
  readonly type: Experience["type"];
  readonly translate?: Translate;
  readonly preferredLanguage?: PreferredLanguage;
}
