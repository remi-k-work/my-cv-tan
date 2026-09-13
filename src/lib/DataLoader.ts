// next
import { cookies, headers } from "next/headers";

// other libraries
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
const LANG_COOKIE = "lang";

export default class DataLoader {
  public readonly lang;

  private constructor(lang: Lang) {
    // Save the just-established preferred language by the user
    this.lang = lang;
  }

  // Create a new instance of DataLoader (we use a factory method because constructors cannot be async)
  public static async create(): Promise<DataLoader> {
    return new DataLoader(await DataLoader.prefferedLanguage());
  }

  // Establish the preferred language by the user
  private static async prefferedLanguage(): Promise<Lang> {
    // Try obtaining the lang value from a local cookie
    const langCookieValue = (await cookies()).get(LANG_COOKIE)?.value;
    if (langCookieValue) {
      if (langCookieValue === "en") return "en";
      if (langCookieValue === "pl") return "pl";

      // Unrecognized language? use english by default
      return "en";
    } else {
      // Otherwise, use the client's preferred language
      const acceptLanguageHeader = (await headers()).get("Accept-Language");
      if (acceptLanguageHeader) {
        const resolvedLanguage = resolveAcceptLanguage(acceptLanguageHeader, ["en-US", "en-GB", "pl-PL"], "en-US");
        return resolvedLanguage.includes("en") ? "en" : "pl";
      }

      // Unrecognized language? use english by default
      return "en";
    }
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
