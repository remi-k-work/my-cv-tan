// The site's language vocabulary and the request inputs its HTML document varies on. The
// negotiation tokens are declared beside the languages they negotiate so a token added on either
// side — the document's Vary (services/headers) or the twin cache-pin
// (markdown/domain/cache-variant) — lands on the other instead of silently breaking shared-cache
// correctness.

// types
import type { PreferredLanguage } from "@/domain/models";

// constants
export const SITE_LANGUAGE_NAMES = { en: "English", pl: "Polish" } as const satisfies Readonly<Record<PreferredLanguage, string>>;
export const OPEN_GRAPH_LOCALES = { en: "en_US", pl: "pl_PL" } as const satisfies Record<PreferredLanguage, string>;

// The one language a document falls back to when a request publishes no supported preference.
export const DEFAULT_LANGUAGE = "en" as const satisfies PreferredLanguage;

export const NEGOTIATION_VARY_TOKENS = ["Cookie", "Accept-Language"] as const;
