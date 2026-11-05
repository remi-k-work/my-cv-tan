// Pure HTTP envelopes for metadata discovery documents and Markdown indexes.
// Route handlers and their Effect/data dependencies live in ./handlers; other features can reuse
// these response contracts without importing the sitemap runtime.

// headers
import { CACHEABLE_HEADERS, MACHINE_HEADERS, NOINDEX_HEADERS, UNAVAILABLE_HEADERS } from "./headers";

// domain
import { SITEMAP_UNAVAILABLE_XML } from "../domain/discovery";

const TXT_CONTENT_TYPE = "text/plain; charset=utf-8";
const XML_CONTENT_TYPE = "application/xml; charset=utf-8";

const TXT_HEADERS = { ...MACHINE_HEADERS, "Content-Type": TXT_CONTENT_TYPE, "Content-Language": "en" } as const;
const SITEMAP_HEADERS = { ...MACHINE_HEADERS, "Content-Type": XML_CONTENT_TYPE } as const;

// robots.txt is a crawler instruction document, not a search result.
export const txtResponse = (body: string) => new Response(body, { status: 200, headers: { ...TXT_HEADERS, ...CACHEABLE_HEADERS, ...NOINDEX_HEADERS } });

export const txtUnavailableResponse = (body: string) => new Response(body, { status: 503, headers: { ...TXT_HEADERS, ...UNAVAILABLE_HEADERS } });

// The AI discovery indexes are guidance documents, never search results.
export const discoveryTxtResponse = (body: string, contentLocation: string) =>
  new Response(body, {
    status: 200,
    headers: { ...TXT_HEADERS, ...CACHEABLE_HEADERS, ...NOINDEX_HEADERS, "Content-Location": contentLocation },
  });

export const sitemapResponse = (xml: string) => new Response(xml, { status: 200, headers: { ...SITEMAP_HEADERS, ...CACHEABLE_HEADERS, ...NOINDEX_HEADERS } });

export const sitemapUnavailableResponse = () =>
  new Response(SITEMAP_UNAVAILABLE_XML, { status: 503, headers: { ...SITEMAP_HEADERS, ...UNAVAILABLE_HEADERS } });
