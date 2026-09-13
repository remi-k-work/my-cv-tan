// Pure, framework-agnostic localization loader (no next/* imports).
// Server code resolves the lang via cookies/headers and passes it in;
// client/loader code uses the returned instance synchronously.

import { resolveAcceptLanguage } from "resolve-accept-language";

import localizedContentEn from "@/assets/data/en/localized-content.json";
import experienceEn from "@/assets/data/en/experience.json";
import portfolioProjectsEn from "@/assets/data/en/portfolio-projects.json";
import pageTitlesEn from "@/assets/data/en/page-titles.json";
import educationSchoolsEn from "@/assets/data/en/education-schools.json";
import localizedContentPl from "@/assets/data/pl/localized-content.json";
import experiencePl from "@/assets/data/pl/experience.json";
import portfolioProjectsPl from "@/assets/data/pl/portfolio-projects.json";
import pageTitlesPl from "@/assets/data/pl/page-titles.json";
import educationSchoolsPl from "@/assets/data/pl/education-schools.json";

import type { EducationSchool, JobExperience, Lang, LocalizedContent, PageTitles } from "@/types/shared";

export const LANG_COOKIE = "lang";

export function resolveLang(langCookieValue: string | null | undefined, acceptLanguageHeader: string | null | undefined): Lang {
  if (langCookieValue) {
    if (langCookieValue === "en") return "en";
    if (langCookieValue === "pl") return "pl";
    return "en";
  }
  if (acceptLanguageHeader) {
    const resolvedLanguage = resolveAcceptLanguage(acceptLanguageHeader, ["en-US", "en-GB", "pl-PL"], "en-US");
    return resolvedLanguage.includes("en") ? "en" : "pl";
  }
  return "en";
}

export default class DataLoader {
  public readonly lang;

  constructor(lang: Lang) {
    this.lang = lang;
  }

  /** Sync factory for loaders/components that already know the lang. */
  public static fromLang(lang: Lang): DataLoader {
    return new DataLoader(lang);
  }

  localizedContent = (): LocalizedContent => (this.lang === "pl" ? localizedContentPl : localizedContentEn);

  allExperiences = (): [JobExperience[], JobExperience[]] => (this.lang === "pl" ? [experiencePl, portfolioProjectsPl] : [experienceEn, portfolioProjectsEn]);

  allPageTitles = (): PageTitles[] => (this.lang === "pl" ? pageTitlesPl : pageTitlesEn);

  allEducationSchools = (): EducationSchool[] => (this.lang === "pl" ? educationSchoolsPl : educationSchoolsEn);
}
