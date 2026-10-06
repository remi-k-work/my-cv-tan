// types
import type { EducationList } from "@/features/education/domain";
import type { Experience, ExperienceList } from "@/features/experience/domain";
import type { PageTitles, PreferredLanguage } from "@/domain";

export interface SocialImage {
  readonly src: string;
  readonly mime: "image/jpeg" | "image/webp";
  readonly width?: number;
  readonly height?: number;
}

export interface SocialMetaInput {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly image: SocialImage;
  readonly ogType: "website" | "article";
  readonly preferredLanguage: PreferredLanguage;
  readonly twitterImage?: SocialImage;
}

// Page heads take the locale resolved from the root match (see language.ts)
export interface PageHeadInput {
  readonly pageTitles: PageTitles | null;
  readonly preferredLanguage: PreferredLanguage;
}

export interface HomeHeadInput extends PageHeadInput {
  readonly experienceList: ExperienceList | null;
}

export interface EducationHeadInput extends PageHeadInput {
  readonly educationList: EducationList | null;
}

export interface ExperienceHeadInput {
  readonly slug: string;
  readonly experience: Experience;
  readonly preferredLanguage: PreferredLanguage;
}
