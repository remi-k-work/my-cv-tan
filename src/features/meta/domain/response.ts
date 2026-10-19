// HTTP responses for the machine-readable discovery documents (robots.txt, sitemap.xml, llms.txt)

// constants
import { CACHE_CONTROL, NOINDEX_FOLLOW, NO_STORE, TXT_CONTENT_TYPE } from "./constants";

const XML_CONTENT_TYPE = "application/xml; charset=utf-8";

// Sitemaps are parsed directly, never ranked: noindex keeps the XML file itself out of
// search results (Google still crawls noindexed sitemaps), follow lets it find the URLs inside
const SITEMAP_HEADERS = { "Content-Type": XML_CONTENT_TYPE, "X-Robots-Tag": NOINDEX_FOLLOW } as const;

// Plain-text discovery document (robots.txt, llms.txt, llms-full.txt): always English, cacheable at the CDN
export const txtResponse = (body: string) =>
  new Response(body, { headers: { "Content-Type": TXT_CONTENT_TYPE, "Content-Language": "en", "Cache-Control": CACHE_CONTROL } });

// Shared 503 shape for every discovery document (Markdown twins included): incomplete content
// must never be cached as if it were complete, and must stay out of search results
export const unavailableResponse = (body: string, headers: Readonly<Record<string, string>>) =>
  new Response(body, { status: 503, headers: { ...headers, "Cache-Control": NO_STORE, "X-Robots-Tag": NOINDEX_FOLLOW } });

// Plain-text 503 twin of txtResponse, for the plain-text discovery documents
export const txtUnavailableResponse = (body: string) => unavailableResponse(body, { "Content-Type": TXT_CONTENT_TYPE, "Content-Language": "en" });

// Cacheable success response: sitemap entries only change when the portfolio data changes
export const sitemapResponse = (xml: string) => new Response(xml, { headers: { ...SITEMAP_HEADERS, "Cache-Control": CACHE_CONTROL } });

// Honest 503 instead of ever emitting an incomplete crawlable sitemap
export const sitemapUnavailableResponse = () =>
  unavailableResponse('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap is temporarily unavailable.</error>', SITEMAP_HEADERS);
