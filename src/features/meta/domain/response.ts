// HTTP response builders for discovery and machine-readable surfaces.
import { Option } from "effect";

// domain
import { markdownTwinUrl } from "./url";
import { AI_INDEX_LINK_HEADER, AI_INDEX_LINKS, canonicalLink, joinLinkHeader, languageVariantLinks } from "./links";

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

// types
import type { PreferredLanguage } from "@/domain/models";

// Base headers with content reuse policy and AI index links.
const baseMachineHeaders = (): Readonly<Record<string, string>> => ({
  "Content-Signal": CONTENT_SIGNAL,
  Link: AI_INDEX_LINK_HEADER,
});

const cacheableHeaders = (): Readonly<Record<string, string>> => ({ "Cache-Control": CACHE_CONTROL });

const unavailableHeaders = (): Readonly<Record<string, string>> => ({
  "Cache-Control": NO_STORE,
  "X-Robots-Tag": NOINDEX_FOLLOW,
});

// Plain-text discovery headers (robots.txt, llms.txt, llms-full.txt).
const txtHeaders = (): Readonly<Record<string, string>> => ({
  ...baseMachineHeaders(),
  "Content-Type": TXT_CONTENT_TYPE,
  "Content-Language": "en",
});

const sitemapHeaders = (): Readonly<Record<string, string>> => ({
  ...baseMachineHeaders(),
  "Content-Type": XML_CONTENT_TYPE,
  "X-Robots-Tag": NOINDEX_FOLLOW,
});

export const txtResponse = (body: string) => new Response(body, { status: 200, headers: txtHeaders() });

export const discoveryTxtResponse = (body: string, contentLocation: string) =>
  new Response(body, {
    status: 200,
    headers: { ...txtHeaders(), ...cacheableHeaders(), "X-Robots-Tag": NOINDEX_FOLLOW, "Content-Location": contentLocation },
  });

export const txtUnavailableResponse = (body: string) =>
  new Response(body, { status: 503, headers: { ...txtHeaders(), ...unavailableHeaders() } });

export const sitemapResponse = (xml: string) =>
  new Response(xml, { status: 200, headers: { ...sitemapHeaders(), ...cacheableHeaders() } });

export const sitemapUnavailableResponse = () =>
  new Response('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap is temporarily unavailable.</error>', {
    status: 503,
    headers: { ...sitemapHeaders(), ...unavailableHeaders() },
  });

// HTML document headers negotiating locale and caching variation.
export const documentHeaders = (preferredLanguage: string): Readonly<Record<string, string>> => ({
  ...baseMachineHeaders(),
  "Content-Language": preferredLanguage,
  Vary: LANGUAGE_VARY,
});

// Markdown twin response headers and builders.
const mdHeaders = (preferredLanguage: PreferredLanguage): Readonly<Record<string, string>> => ({
  ...baseMachineHeaders(),
  "Content-Type": MD_CONTENT_TYPE,
  ...cacheableHeaders(),
  "Content-Language": preferredLanguage,
  Vary: LANGUAGE_VARY,
  "X-Robots-Tag": INDEXABLE_ROBOTS,
});

const mdUnavailableHeaders = (preferredLanguage: PreferredLanguage) => ({
  ...mdHeaders(preferredLanguage),
  ...unavailableHeaders(),
});

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
    headers: {
      ...mdHeaders(input.preferredLanguage),
      "Content-Location": markdownUrl,
      Link: markdownLinks(input.canonical, markdownUrl),
    },
  });
};

export const mdNotFoundResponse = (body: string, preferredLanguage: PreferredLanguage, markdownPath: Option.Option<string>) => {
  const location = Option.isSome(markdownPath)
    ? { "Content-Location": markdownTwinUrl(markdownPath.value, preferredLanguage) }
    : undefined;

  return new Response(body, {
    status: 404,
    headers: {
      ...mdUnavailableHeaders(preferredLanguage),
      ...location,
    },
  });
};

export const mdUnavailableResponse = (body: string, preferredLanguage: PreferredLanguage) =>
  new Response(body, { status: 503, headers: mdUnavailableHeaders(preferredLanguage) });
