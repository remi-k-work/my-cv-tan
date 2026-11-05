// The shared response-header vocabulary for HTML documents and machine-readable routes:
// the reuse signal, the AI-index advertisements, caching, indexing directives, and the
// language negotiation every surface projects into its own responses.

// types
import type { PreferredLanguage } from "@/domain/models";

// constants
import { INDEXABLE_ROBOTS, NOINDEX_FOLLOW, NO_STORE } from "@/domain/http";
import { CONTENT_SIGNAL } from "../domain/constants";
import { AI_INDEX_LINK_HEADER } from "../domain/link-tags";

// Language-negotiated documents must vary on both inputs.
export const LANGUAGE_VARY = "Cookie, Accept-Language";

// The reuse signal and AI-index advertisements every response repeats.
export const MACHINE_HEADERS = { "Content-Signal": CONTENT_SIGNAL, Link: AI_INDEX_LINK_HEADER } as const;

const CACHE_CONTROL = "public, max-age=3600, stale-while-revalidate=86400";
// A successful representation may be cached; a failure never is.
export const CACHEABLE_HEADERS = { "Cache-Control": CACHE_CONTROL } as const;
// Documents crawlers may read but must not list as results, while still following their links.
export const NOINDEX_HEADERS = { "X-Robots-Tag": NOINDEX_FOLLOW } as const;
export const UNAVAILABLE_HEADERS = { "Cache-Control": NO_STORE, ...NOINDEX_HEADERS } as const;
// Indexable documents opt into full snippets and large previews.
export const INDEXABLE_HEADERS = { "X-Robots-Tag": INDEXABLE_ROBOTS } as const;

// The HTML document's header block. It carries the same reuse signal and AI-index advertisements
// as the Markdown twins, the indexes and robots.txt, so a crawler reading only the response headers
// — never the <head> or the discovery documents — still learns the site's ingestion policy.
// Content-Language names the locale the root loader just negotiated, so the HTTP signal, the
// <html lang> attribute and the JSON-LD inLanguage fields all resolve to one value.
export const documentHeaders = (preferredLanguage: PreferredLanguage): Readonly<Record<string, string>> => ({
  ...MACHINE_HEADERS,
  "Content-Language": preferredLanguage,
  Vary: LANGUAGE_VARY,
});
