// types
import type { PageTitles, PreferredLanguage, Translate } from "@/domain";
import type { Experience, ExperienceList } from "@/features/experience/domain";
import type { EducationList } from "@/features/education/domain";

// translate is injected so the pure builders stay testable; the service decides where translations come from
export interface HomeMdInput {
  readonly pageTitles: PageTitles;
  readonly experienceList: ExperienceList;
  readonly preferredLanguage: PreferredLanguage;
  readonly translate: Translate;
}

export interface EducationMdInput {
  readonly pageTitles: PageTitles;
  readonly educationList: EducationList;
  readonly preferredLanguage: PreferredLanguage;
  readonly translate: Translate;
}

export interface ContactMdInput {
  readonly pageTitles: PageTitles;
  readonly preferredLanguage: PreferredLanguage;
  readonly translate: Translate;
}

export interface ExperienceMdInput {
  readonly experience: Experience;
  readonly preferredLanguage: PreferredLanguage;
  readonly translate: Translate;
}

export interface BuildNotFoundMdInput {
  readonly slug: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly translate: Translate;
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
