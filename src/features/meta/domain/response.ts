// HTTP response builders for discovery and machine-readable surfaces.

// services, features, and other libraries
import { Option } from "effect";
import { markdownTwinUrl } from "./url";
import { canonicalLink, joinLinkHeader, languageVariantLinks } from "./links";

// types
import type { PreferredLanguage } from "@/domain/models";

// constants
import {
  CACHE_CONTROL,
  CONTENT_SIGNAL,
  INDEXABLE_ROBOTS,
  LANGUAGE_VARY,
  MD_CONTENT_TYPE,
  NOINDEX_FOLLOW,
  NO_STORE,
  TXT_CONTENT_TYPE,
  XML_CONTENT_TYPE,
} from "./constants";
import { AI_INDEX_LINK_HEADER, AI_INDEX_LINKS } from "./links";

// Base headers with content reuse policy and AI index links.
const BASE_MACHINE_HEADERS = { "Content-Signal": CONTENT_SIGNAL, Link: AI_INDEX_LINK_HEADER } as const;
const CACHEABLE_HEADERS = { "Cache-Control": CACHE_CONTROL } as const;
const UNAVAILABLE_HEADERS = { "Cache-Control": NO_STORE, "X-Robots-Tag": NOINDEX_FOLLOW } as const;

// Plain-text discovery headers (robots.txt, llms.txt, llms-full.txt).
const TXT_HEADERS = { ...BASE_MACHINE_HEADERS, "Content-Type": TXT_CONTENT_TYPE, "Content-Language": "en" } as const;
const SITEMAP_HEADERS = { ...BASE_MACHINE_HEADERS, "Content-Type": XML_CONTENT_TYPE, "X-Robots-Tag": NOINDEX_FOLLOW } as const;

export const txtResponse = (body: string) => new Response(body, { status: 200, headers: TXT_HEADERS });
export const txtUnavailableResponse = (body: string) => new Response(body, { status: 503, headers: { ...TXT_HEADERS, ...UNAVAILABLE_HEADERS } });

export const discoveryTxtResponse = (body: string, contentLocation: string) =>
  new Response(body, { status: 200, headers: { ...TXT_HEADERS, ...CACHEABLE_HEADERS, "X-Robots-Tag": NOINDEX_FOLLOW, "Content-Location": contentLocation } });

export const sitemapResponse = (xml: string) => new Response(xml, { status: 200, headers: { ...SITEMAP_HEADERS, ...CACHEABLE_HEADERS } });
export const sitemapUnavailableResponse = () =>
  new Response('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap is temporarily unavailable.</error>', {
    status: 503,
    headers: { ...SITEMAP_HEADERS, ...UNAVAILABLE_HEADERS },
  });

// HTML document headers negotiating locale and caching variation.
export const documentHeaders = (preferredLanguage: string): Readonly<Record<string, string>> => ({
  ...BASE_MACHINE_HEADERS,
  "Content-Language": preferredLanguage,
  Vary: LANGUAGE_VARY,
});

// Markdown twin response headers and builders.
const mdHeaders = (preferredLanguage: PreferredLanguage): Readonly<Record<string, string>> => ({
  ...BASE_MACHINE_HEADERS,
  "Content-Type": MD_CONTENT_TYPE,
  ...CACHEABLE_HEADERS,
  "Content-Language": preferredLanguage,
  Vary: LANGUAGE_VARY,
  "X-Robots-Tag": INDEXABLE_ROBOTS,
});
const mdUnavailableHeaders = (preferredLanguage: PreferredLanguage) => ({ ...mdHeaders(preferredLanguage), ...UNAVAILABLE_HEADERS });

const markdownLinks = (canonical: string, markdownUrl: string) =>
  joinLinkHeader([canonicalLink(canonical), ...AI_INDEX_LINKS, ...languageVariantLinks(markdownUrl)]);

export const mdResponse = (input: {
  readonly body: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly canonical: string;
  readonly markdownPath: string;
}) => {
  const markdownUrl = markdownTwinUrl(input.markdownPath, input.preferredLanguage);

  return new Response(input.body, {
    status: 200,
    headers: { ...mdHeaders(input.preferredLanguage), "Content-Location": markdownUrl, Link: markdownLinks(input.canonical, markdownUrl) },
  });
};

export const mdNotFoundResponse = (body: string, preferredLanguage: PreferredLanguage, markdownPath: Option.Option<string>) => {
  const location = Option.isSome(markdownPath) ? { "Content-Location": markdownTwinUrl(markdownPath.value, preferredLanguage) } : undefined;

  return new Response(body, { status: 404, headers: { ...mdUnavailableHeaders(preferredLanguage), ...location } });
};

export const mdUnavailableResponse = (body: string, preferredLanguage: PreferredLanguage) =>
  new Response(body, { status: 503, headers: mdUnavailableHeaders(preferredLanguage) });
