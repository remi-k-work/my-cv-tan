// services, features, and other libraries
import { resolveAcceptLanguage } from "resolve-accept-language";

// assets
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

// types
import type { EducationSchool, JobExperience, Lang, LocalizedContent, PageTitles } from "@/types/shared";

// constants
export const LANG_COOKIE = "lang";

// Establish the preferred language by the user
export function resolveLang(langCookieValue: string | null | undefined, acceptLanguageHeader: string | null | undefined): Lang {
  // Try obtaining the lang value from a local cookie
  if (langCookieValue) {
    if (langCookieValue === "en") return "en";
    if (langCookieValue === "pl") return "pl";

    // Unrecognized language? use english by default
    return "en";
  }
  if (acceptLanguageHeader) {
    // Otherwise, use the client's preferred language
    const resolvedLanguage = resolveAcceptLanguage(acceptLanguageHeader, ["en-US", "en-GB", "pl-PL"], "en-US");
    return resolvedLanguage.includes("en") ? "en" : "pl";
  }

  // Unrecognized language? use english by default
  return "en";
}

export default class DataLoader {
  public readonly lang;

  constructor(lang: Lang) {
    // Save the just-established preferred language by the user
    this.lang = lang;
  }

  // Sync factory for loaders/components that already know the language
  public static fromLang(lang: Lang): DataLoader {
    return new DataLoader(lang);
  }

  // Obtain the localized content for the preferred language
  localizedContent = (): LocalizedContent => (this.lang === "pl" ? localizedContentPl : localizedContentEn);

  // Obtain a list of all job experiences from an outside source
  allExperiences = (): [JobExperience[], JobExperience[]] => (this.lang === "pl" ? [experiencePl, portfolioProjectsPl] : [experienceEn, portfolioProjectsEn]);

  // Get all the page titles from an outside source
  allPageTitles = (): PageTitles[] => (this.lang === "pl" ? pageTitlesPl : pageTitlesEn);

  // Obtain a list of all education schools from an outside source
  allEducationSchools = (): EducationSchool[] => (this.lang === "pl" ? educationSchoolsPl : educationSchoolsEn);
}
