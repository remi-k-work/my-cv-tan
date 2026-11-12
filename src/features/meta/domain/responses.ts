// The HTTP surface every rendered document and machine-readable endpoint shares: the content,
// caching, robots and language-negotiation headers, plus the plain-text and XML response envelopes
// used by the discovery documents and the Markdown twins.

// services, features, and other libraries
import { Array } from "effect";

// types
import type { PreferredLanguage } from "@/domain/models";

// constants
import { DEFAULT_LANGUAGE } from "@/domain/constants";
import { INDEXABLE_ROBOTS, NOINDEX_FOLLOW, NO_STORE, RETRY_AFTER } from "@/domain/http";
import { AI_INDEX_LINK_HEADER, CONTENT_SIGNAL } from "./discovery";

export const NEGOTIATION_VARY_TOKENS = ["Cookie", "Accept-Language"] as const;

// HTTP metadata headers for caching, robots indexing directives, and language negotiation
export const MACHINE_HEADERS = { "Content-Signal": CONTENT_SIGNAL, Link: AI_INDEX_LINK_HEADER } as const;

export const CACHEABLE_HEADERS = { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } as const;

export const NOINDEX_HEADERS = { "X-Robots-Tag": NOINDEX_FOLLOW } as const;
export const UNAVAILABLE_HEADERS = { "Cache-Control": NO_STORE, ...NOINDEX_HEADERS } as const;
export const SERVICE_UNAVAILABLE_HEADERS = { ...UNAVAILABLE_HEADERS, "Retry-After": RETRY_AFTER } as const;

export const INDEXABLE_HEADERS = { "X-Robots-Tag": INDEXABLE_ROBOTS } as const;

export const TXT_HEADERS = { ...MACHINE_HEADERS, "Content-Type": "text/plain; charset=utf-8", "Content-Language": DEFAULT_LANGUAGE } as const;
export const SITEMAP_HEADERS = { ...MACHINE_HEADERS, "Content-Type": "application/xml; charset=utf-8" } as const;
export const SITEMAP_UNAVAILABLE_XML = '<?xml version="1.0" encoding="UTF-8"?><error>Sitemap is temporarily unavailable.</error>';

// Base response headers for rendered HTML documents
export const documentHeaders = (preferredLanguage: PreferredLanguage) =>
  ({
    ...MACHINE_HEADERS,
    "Content-Language": preferredLanguage,
    Vary: Array.join(NEGOTIATION_VARY_TOKENS, ", "),
  }) as const;

// HTTP response envelope helpers for plain-text and XML discovery endpoints
const instructionsHeaders = (contentLocation?: string) => ({
  ...TXT_HEADERS,
  ...CACHEABLE_HEADERS,
  ...NOINDEX_HEADERS,
  ...(contentLocation === undefined ? {} : { "Content-Location": contentLocation }),
});

export const txtResponse = (body: string, contentLocation?: string) => new Response(body, { status: 200, headers: instructionsHeaders(contentLocation) });
export const txtUnavailableResponse = (body: string) => new Response(body, { status: 503, headers: { ...TXT_HEADERS, ...SERVICE_UNAVAILABLE_HEADERS } });
export const sitemapResponse = (xml: string) => new Response(xml, { status: 200, headers: { ...SITEMAP_HEADERS, ...CACHEABLE_HEADERS, ...NOINDEX_HEADERS } });
export const sitemapUnavailableResponse = () =>
  new Response(SITEMAP_UNAVAILABLE_XML, { status: 503, headers: { ...SITEMAP_HEADERS, ...SERVICE_UNAVAILABLE_HEADERS } });
