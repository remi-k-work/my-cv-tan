// types
import type { PageTitles, PreferredLanguage } from "@/domain";
import type { ExperienceList } from "@/features/experience/domain";
import type { EducationList } from "@/features/education/domain";

// Resolves a msg()-registered source string into the requested language; injected so the
// pure builders stay testable while the service decides where translations come from
export type Translate = (source: string) => string;

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
