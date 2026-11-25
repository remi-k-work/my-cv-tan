// Shared HTTP policy and response envelopes for HTML and machine-readable documents.

// services, features, and other libraries
import { Array, Predicate, Record } from "effect";

// types
import type { PreferredLanguage } from "@/domain/models";

// constants
import { DEFAULT_LANGUAGE } from "@/domain/constants";
import { INDEXABLE_ROBOTS, NOINDEX_FOLLOW, NO_STORE, RETRY_AFTER } from "@/domain/http";
import { AI_DISCOVERY_LINK_HEADER, CONTENT_SIGNAL, SITEMAP_INDEX } from "@/features/meta/domain/discovery";

// Pinned Markdown variants remove these tokens; every other negotiated document emits them.
export const NEGOTIATION_VARY_TOKENS = ["Cookie", "Accept-Language"] as const;

const SHARED_HEADERS = { "Content-Signal": CONTENT_SIGNAL, Link: AI_DISCOVERY_LINK_HEADER, "X-Content-Type-Options": "nosniff" } as const;

export const CACHEABLE_HEADERS = { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } as const;

const NOINDEX_HEADERS = { "X-Robots-Tag": NOINDEX_FOLLOW } as const;
export const UNAVAILABLE_HEADERS = { "Cache-Control": NO_STORE, ...NOINDEX_HEADERS } as const;
export const SERVICE_UNAVAILABLE_HEADERS = { ...UNAVAILABLE_HEADERS, "Retry-After": RETRY_AFTER } as const;

export const INDEXABLE_HEADERS = { "X-Robots-Tag": INDEXABLE_ROBOTS } as const;

const TXT_HEADERS = { ...SHARED_HEADERS, "Content-Type": "text/plain; charset=utf-8", "Content-Language": DEFAULT_LANGUAGE } as const;
const SITEMAP_HEADERS = { ...SHARED_HEADERS, "Content-Type": "application/xml; charset=utf-8" } as const;
const SITEMAP_UNAVAILABLE_XML = '<?xml version="1.0" encoding="UTF-8"?><error>Sitemap is temporarily unavailable.</error>';

// Base response headers for rendered HTML documents
export const documentHeaders = (preferredLanguage: PreferredLanguage) =>
  ({
    ...SHARED_HEADERS,
    "Content-Language": preferredLanguage,
    Vary: Array.join(NEGOTIATION_VARY_TOKENS, ", "),
  }) as const;

export const locationHeader = (contentLocation?: string): Readonly<Record<string, string>> =>
  Record.filter({ "Content-Location": contentLocation }, Predicate.isNotUndefined);

const instructionsHeaders = (contentLocation?: string) => ({
  ...TXT_HEADERS,
  ...CACHEABLE_HEADERS,
  ...NOINDEX_HEADERS,
  ...locationHeader(contentLocation),
});

export const txtResponse = (body: string, contentLocation?: string) => new Response(body, { status: 200, headers: instructionsHeaders(contentLocation) });
export const txtUnavailableResponse = (body: string, contentLocation?: string) =>
  new Response(body, { status: 503, headers: { ...TXT_HEADERS, ...SERVICE_UNAVAILABLE_HEADERS, ...locationHeader(contentLocation) } });
export const sitemapResponse = (xml: string) =>
  new Response(xml, {
    status: 200,
    headers: { ...SITEMAP_HEADERS, ...CACHEABLE_HEADERS, ...NOINDEX_HEADERS, ...locationHeader(SITEMAP_INDEX.url) },
  });
export const sitemapUnavailableResponse = () =>
  new Response(SITEMAP_UNAVAILABLE_XML, {
    status: 503,
    headers: { ...SITEMAP_HEADERS, ...SERVICE_UNAVAILABLE_HEADERS, ...locationHeader(SITEMAP_INDEX.url) },
  });
