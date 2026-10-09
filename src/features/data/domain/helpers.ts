// services, features, and other libraries
import { Option } from "effect";
import { getLocale } from "gt-tanstack-start";

// types
import type { PreferredLanguage } from "@/domain";

export const preferredLanguageFromLocale = (locale: string): PreferredLanguage => (locale === "pl" ? "pl" : "en");

// An explicit language override (e.g. the Markdown ?lang= parameter) wins; otherwise the locale GT resolved for this request decides.
export const requestPreferredLanguage = (override: Option.Option<PreferredLanguage>): PreferredLanguage =>
  Option.getOrElse(override, () => preferredLanguageFromLocale(getLocale()));
