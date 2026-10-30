// services, features, and other libraries
import { Option } from "effect";
import { getLocale } from "gt-tanstack-start";
import { preferredLanguageFromLocale } from "@/domain/helpers";

// types
import type { PreferredLanguage } from "@/domain/models";

// An explicit language override (e.g. the Markdown ?lang= parameter) wins; otherwise the locale GT resolved for this request decides.
export const requestPreferredLanguage = (override: Option.Option<PreferredLanguage>): PreferredLanguage =>
  Option.getOrElse(override, () => preferredLanguageFromLocale(getLocale()));
