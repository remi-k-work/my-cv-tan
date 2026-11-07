// Pure HTTP envelopes for metadata discovery documents and Markdown indexes.
// Route handlers and their Effect/data dependencies live in ./handlers; other features can reuse
// these response contracts without importing the sitemap runtime.

// headers
import { CACHEABLE_HEADERS, MACHINE_HEADERS, NOINDEX_HEADERS, SERVICE_UNAVAILABLE_HEADERS } from "./headers";

// domain
import { DEFAULT_LANGUAGE } from "../domain/languages";
import { SITEMAP_UNAVAILABLE_XML } from "../domain/sitemap";

const TXT_CONTENT_TYPE = "text/plain; charset=utf-8";
const XML_CONTENT_TYPE = "application/xml; charset=utf-8";

// These documents are the site's crawler instructions, published once in the source language the
// AI indexes are built in — so the header names that language rather than repeating an independent
// guess about it. The sitemap carries no such header: it lists URLs only, with no prose a reader
// could be handed in the wrong language.
const TXT_HEADERS = { ...MACHINE_HEADERS, "Content-Type": TXT_CONTENT_TYPE, "Content-Language": DEFAULT_LANGUAGE } as const;
const SITEMAP_HEADERS = { ...MACHINE_HEADERS, "Content-Type": XML_CONTENT_TYPE } as const;

// robots.txt and the AI discovery indexes are crawler instruction documents, not search results:
// a successful representation may be cached and names the index it represents through
// Content-Location, a failure never is.
const instructionsHeaders = (contentLocation?: string) => ({
  ...TXT_HEADERS,
  ...CACHEABLE_HEADERS,
  ...NOINDEX_HEADERS,
  ...(contentLocation === undefined ? {} : { "Content-Location": contentLocation }),
});

export const txtResponse = (body: string, contentLocation?: string) => new Response(body, { status: 200, headers: instructionsHeaders(contentLocation) });

export const txtUnavailableResponse = (body: string) => new Response(body, { status: 503, headers: { ...TXT_HEADERS, ...SERVICE_UNAVAILABLE_HEADERS } });

export const sitemapResponse = (xml: string) => new Response(xml, { status: 200, headers: { ...SITEMAP_HEADERS, ...CACHEABLE_HEADERS, ...NOINDEX_HEADERS } });

export const sitemapUnavailableResponse = () => new Response(SITEMAP_UNAVAILABLE_XML, { status: 503, headers: { ...SITEMAP_HEADERS, ...SERVICE_UNAVAILABLE_HEADERS } });
