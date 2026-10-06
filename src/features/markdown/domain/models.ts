// types
import type { LocalizedContent, PageTitles, PreferredLanguage } from "@/domain";
import type { ExperienceList } from "@/features/experience/domain";
import type { EducationList } from "@/features/education/domain";

export interface HomeMdInput {
  readonly pageTitles: PageTitles;
  readonly localizedContent: LocalizedContent;
  readonly experienceList: ExperienceList;
  readonly preferredLanguage: PreferredLanguage;
}

export interface EducationMdInput {
  readonly pageTitles: PageTitles;
  readonly educationList: EducationList;
  readonly preferredLanguage: PreferredLanguage;
}

export interface ContactMdInput {
  readonly pageTitles: PageTitles;
  readonly preferredLanguage: PreferredLanguage;
}
