// services, features, and other libraries
import { resolveAcceptLanguage } from "resolve-accept-language";

// assets
import localizedContentEn from "@/assets/data/en/localized-content.json";
import localizedContentPl from "@/assets/data/pl/localized-content.json";
import pageTitlesEn from "@/assets/data/en/page-titles.json";
import pageTitlesPl from "@/assets/data/pl/page-titles.json";
import experienceEn from "@/assets/data/en/experience.json";
import experiencePl from "@/assets/data/pl/experience.json";
import portfolioEn from "@/assets/data/en/portfolio.json";
import portfolioPl from "@/assets/data/pl/portfolio.json";
import educationEn from "@/assets/data/en/education.json";
import educationPl from "@/assets/data/pl/education.json";

// types
import type { PreferredLanguage } from "@/domain";
import type { Experience } from "@/types/shared";

// constants
export const LANG_COOKIE = "lang";

// Establish the preferred language by the user
export function resolveLang(langCookieValue: string | null | undefined, acceptLanguageHeader: string | null | undefined) {
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
  public readonly preferredLanguage;

  constructor(preferredLanguage: PreferredLanguage) {
    // Save the just-established preferred language by the user
    this.preferredLanguage = preferredLanguage;
  }

  // Sync factory for loaders/components that already know the language
  public static fromLang(preferredLanguage: PreferredLanguage): DataLoader {
    return new DataLoader(preferredLanguage);
  }

  // Obtain the localized content for the preferred language
  public get localizedContent() {
    return this.preferredLanguage === "pl" ? localizedContentPl : localizedContentEn;
  }

  // Get all the page titles from an outside source
  public get pageTitles() {
    return this.preferredLanguage === "pl" ? pageTitlesPl : pageTitlesEn;
  }

  // Obtain a list of all job experiences from an outside source
  public get experience(): [Experience[], Experience[]] {
    return this.preferredLanguage === "pl" ? [experiencePl, portfolioPl] : [experienceEn, portfolioEn];
  }

  // Obtain a list of all education schools from an outside source
  public get education() {
    return this.preferredLanguage === "pl" ? educationPl : educationEn;
  }
}
