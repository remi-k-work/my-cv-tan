// types
import type { LocalizedContent, PageTitles, PreferredLanguage } from "@/domain";
import type { ExperienceList } from "@/features/experience/domain";
import type { EducationList } from "@/features/education/domain";

export interface HomeMdInput {
  readonly pageTitles: PageTitles | null;
  readonly localizedContent: LocalizedContent | null;
  readonly experienceList: ExperienceList;
  readonly preferredLanguage: PreferredLanguage;
}

export interface EducationMdInput {
  readonly pageTitles: PageTitles | null;
  readonly educationList: EducationList;
  readonly preferredLanguage: PreferredLanguage;
}

export interface ContactMdInput {
  readonly pageTitles: PageTitles | null;
  readonly preferredLanguage: PreferredLanguage;
}
