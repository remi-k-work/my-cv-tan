// types
import type { PreferredLanguage } from "@/domain";

export const preferredLanguageFromLocale = (locale: string): PreferredLanguage => (locale === "pl" ? "pl" : "en");
