// Resolve an optional language override against the locale selected for the active request.

// services, features, and other libraries
import { Option } from "effect";
import { getLocale } from "gt-tanstack-start";
import { preferredLanguageFromLocale } from "@/domain/helpers";

// types
import type { PreferredLanguage } from "@/domain/models";

export const requestPreferredLanguage = (override: Option.Option<PreferredLanguage>): PreferredLanguage =>
  Option.getOrElse(override, () => preferredLanguageFromLocale(getLocale()));
