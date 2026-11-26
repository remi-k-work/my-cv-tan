// Shared HTTP policy and response envelopes for HTML and machine-readable documents.

// services, features, and other libraries
import { Array, Option, Record, String, pipe } from "effect";

// types
import type { PreferredLanguage } from "@/domain/models";

// constants
import { DEFAULT_LANGUAGE } from "@/domain/constants";
import { INDEXABLE_ROBOTS, NOINDEX_FOLLOW, NO_STORE, RETRY_AFTER } from "@/domain/http";
import { AI_DISCOVERY_LINK_HEADER, aiDiscoveryLinkHeader, CONTENT_SIGNAL, SITEMAP_INDEX } from "@/features/meta/domain/discovery";

// Pinned Markdown variants remove these tokens; every other negotiated document emits them.
export const NEGOTIATION_VARY_TOKENS = ["Cookie", "Accept-Language"] as const;

const BASE_HEADERS = { "Content-Signal": CONTENT_SIGNAL, "X-Content-Type-Options": "nosniff" } as const;
const SHARED_HEADERS = { ...BASE_HEADERS, Link: AI_DISCOVERY_LINK_HEADER } as const;

export const CACHEABLE_HEADERS = { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } as const;

const NOINDEX_HEADERS = { "X-Robots-Tag": NOINDEX_FOLLOW } as const;
const CACHEABLE_NOINDEX_HEADERS = { ...CACHEABLE_HEADERS, ...NOINDEX_HEADERS } as const;
export const UNAVAILABLE_HEADERS = { "Cache-Control": NO_STORE, ...NOINDEX_HEADERS } as const;
export const SERVICE_UNAVAILABLE_HEADERS = { ...UNAVAILABLE_HEADERS, "Retry-After": RETRY_AFTER } as const;

export const INDEXABLE_HEADERS = { "X-Robots-Tag": INDEXABLE_ROBOTS } as const;

const TXT_HEADERS = { ...BASE_HEADERS, "Content-Type": "text/plain; charset=utf-8", "Content-Language": DEFAULT_LANGUAGE } as const;
const SITEMAP_HEADERS = { ...SHARED_HEADERS, "Content-Type": "application/xml; charset=utf-8" } as const;
const SITEMAP_UNAVAILABLE_XML = '<?xml version="1.0" encoding="UTF-8"?><error>Sitemap is temporarily unavailable.</error>';

// Omits empty or absent optional headers rather than emitting blank header values on the wire
const optionalHeader = (name: string, value: string | undefined): Readonly<Record<string, string>> =>
  pipe(
    Option.fromUndefinedOr(value),
    Option.filter(String.isNonEmpty),
    Option.match({
      onNone: Record.empty<string, string>,
      onSome: (headerValue) => ({ [name]: headerValue }),
    })
  );

const txtHeaders = (contentLocation?: string) => ({ ...TXT_HEADERS, ...optionalHeader("Link", aiDiscoveryLinkHeader(contentLocation)) });

// Base response headers for rendered HTML documents
export const documentHeaders = (preferredLanguage: PreferredLanguage) =>
  ({
    ...SHARED_HEADERS,
    "Content-Language": preferredLanguage,
    Vary: Array.join(NEGOTIATION_VARY_TOKENS, ", "),
  }) as const;

export const locationHeader = (contentLocation?: string): Readonly<Record<string, string>> => optionalHeader("Content-Location", contentLocation);

const responseEnvelope = (status: 200 | 503, body: string, headers: Readonly<Record<string, string>>) => new Response(body, { status, headers });

const txtEnvelope = (status: 200 | 503, body: string, policyHeaders: Readonly<Record<string, string>>, contentLocation?: string) =>
  responseEnvelope(status, body, { ...txtHeaders(contentLocation), ...policyHeaders, ...locationHeader(contentLocation) });

const sitemapEnvelope = (status: 200 | 503, xml: string, policyHeaders: Readonly<Record<string, string>>) =>
  responseEnvelope(status, xml, { ...SITEMAP_HEADERS, ...policyHeaders, ...locationHeader(SITEMAP_INDEX.url) });

export const txtResponse = (body: string, contentLocation?: string) => txtEnvelope(200, body, CACHEABLE_NOINDEX_HEADERS, contentLocation);
export const txtUnavailableResponse = (body: string, contentLocation?: string) => txtEnvelope(503, body, SERVICE_UNAVAILABLE_HEADERS, contentLocation);
export const sitemapResponse = (xml: string) => sitemapEnvelope(200, xml, CACHEABLE_NOINDEX_HEADERS);
export const sitemapUnavailableResponse = () => sitemapEnvelope(503, SITEMAP_UNAVAILABLE_XML, SERVICE_UNAVAILABLE_HEADERS);
