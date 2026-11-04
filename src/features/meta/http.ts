// Shared headers and responses for HTML and machine-readable routes.

// types
import type { PreferredLanguage } from "@/domain/models";

// constants
import {
  CACHE_CONTROL,
  CONTENT_SIGNAL,
  LANGUAGE_VARY,
  NOINDEX_FOLLOW,
  NO_STORE,
  TXT_CONTENT_TYPE,
  XML_CONTENT_TYPE,
} from "./domain/constants";
import { AI_INDEX_LINK_HEADER } from "./domain/helpers";

export const MACHINE_HEADERS = { "Content-Signal": CONTENT_SIGNAL, Link: AI_INDEX_LINK_HEADER } as const;
export const CACHEABLE_HEADERS = { "Cache-Control": CACHE_CONTROL } as const;
export const UNAVAILABLE_HEADERS = { "Cache-Control": NO_STORE, "X-Robots-Tag": NOINDEX_FOLLOW } as const;

const TXT_HEADERS = { ...MACHINE_HEADERS, "Content-Type": TXT_CONTENT_TYPE, "Content-Language": "en" } as const;
const SITEMAP_HEADERS = { ...MACHINE_HEADERS, "Content-Type": XML_CONTENT_TYPE, "X-Robots-Tag": NOINDEX_FOLLOW } as const;

export const txtResponse = (body: string) =>
  new Response(body, { status: 200, headers: { ...TXT_HEADERS, ...CACHEABLE_HEADERS } });

export const txtUnavailableResponse = (body: string) =>
  new Response(body, { status: 503, headers: { ...TXT_HEADERS, ...UNAVAILABLE_HEADERS } });

export const discoveryTxtResponse = (body: string, contentLocation: string) =>
  new Response(body, {
    status: 200,
    headers: { ...TXT_HEADERS, ...CACHEABLE_HEADERS, "X-Robots-Tag": NOINDEX_FOLLOW, "Content-Location": contentLocation },
  });

export const sitemapResponse = (xml: string) =>
  new Response(xml, { status: 200, headers: { ...SITEMAP_HEADERS, ...CACHEABLE_HEADERS } });

export const sitemapUnavailableResponse = () =>
  new Response('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap is temporarily unavailable.</error>', {
    status: 503,
    headers: { ...SITEMAP_HEADERS, ...UNAVAILABLE_HEADERS },
  });

export const documentHeaders = (preferredLanguage: PreferredLanguage): Readonly<Record<string, string>> => ({
  ...MACHINE_HEADERS,
  "Content-Language": preferredLanguage,
  Vary: LANGUAGE_VARY,
});
