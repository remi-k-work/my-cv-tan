// --- Shared HTTP response builders ---
//
// One module for every machine-readable Response in the app: robots.txt, sitemap.xml,
// llms.txt, llms-full.txt, Markdown twins, and the HTML document headers. The body is
// minted per call (a Response body is single-use) so nothing is held as a module constant.
//
// A discovery document is one body, one status and one header record; every builder below is
// the choice of record. Shared signals — Cache-Control, Content-Signal, the AI-index Link —
// live in exactly one place per family.

// services, features, and other libraries
import { Option } from "effect";

// domain
import { markdownTwinUrl, absoluteUrl } from "./url";
import { AI_INDEX_LINK_HEADER, AI_INDEX_LINKS, joinLinkHeader, languageVariantLinks } from "./links";

// constants
import {
  CACHE_CONTROL,
  CONTENT_SIGNAL,
  INDEXABLE_ROBOTS,
  LANGUAGE_VARY,
  NOINDEX_FOLLOW,
  NO_STORE,
  TXT_CONTENT_TYPE,
  XML_CONTENT_TYPE,
} from "./constants";

// types
import type { PreferredLanguage } from "@/domain/models";

// --- Header factories ---

// Base every machine-readable document layers on: reuse signal + AI-index advertisements.
// The AI indexes are advertised from the HTTP layer as well as from every <head>.
export const baseMachineHeaders = (): Readonly<Record<string, string>> => ({
  "Content-Signal": CONTENT_SIGNAL,
  Link: AI_INDEX_LINK_HEADER,
});

// Cacheable success headers: machine-readable documents only change when data changes.
export const cacheableHeaders = (): Readonly<Record<string, string>> => ({ "Cache-Control": CACHE_CONTROL });

// Unavailable headers: never cached as complete, never indexed, but still advertising the
// retrieval surface so a crawler is never at a dead end.
export const unavailableHeaders = (): Readonly<Record<string, string>> => ({
  "Cache-Control": NO_STORE,
  "X-Robots-Tag": NOINDEX_FOLLOW,
});

// --- Generic discovery response ---

// One body, one status, one header record: the shared constructor every discovery document uses.
// A Response body is single-use, so the document is minted per call rather than held constant.
export const discoveryResponse = (body: BodyInit | null, headers: Readonly<Record<string, string>>, options: { readonly status?: number; readonly statusText?: string } = {}) =>
  new Response(body, { status: options.status ?? 200, statusText: options.statusText, headers });

// --- Plain-text discovery responses ---

// robots.txt / llms.txt / llms-full.txt headers: English regardless of locale.
export const txtHeaders = (): Readonly<Record<string, string>> => ({
  ...baseMachineHeaders(),
  "Content-Type": TXT_CONTENT_TYPE,
  "Content-Language": "en",
});

// Sitemap headers: XML content type, noindex (parsed directly, never ranked), follow (crawlable).
export const sitemapHeaders = (): Readonly<Record<string, string>> => ({
  ...baseMachineHeaders(),
  "Content-Type": XML_CONTENT_TYPE,
  "X-Robots-Tag": NOINDEX_FOLLOW,
});

// Mint a plain-text discovery response with the shared discovery headers, optionally cacheable.
// A new header record is built on every call — never mutated — so each Response owns its headers.
export const txtResponse = (body: string, options: { readonly cacheable?: boolean; readonly contentLocation?: string } = {}) => {
  const headers: Record<string, string> = { ...txtHeaders(), ...(options.cacheable ? cacheableHeaders() : {}) };
  if (options.contentLocation) headers["Content-Location"] = options.contentLocation;
  return new Response(body, { status: 200, headers });
};

// llms.txt / llms-full.txt: serve AI fetchers, not search results — noindex but still crawlable.
// Content-Location names the canonical representation so a crawler can fetch it by URL.
export const discoveryTxtResponse = (body: string, contentLocation?: string) =>
  new Response(body, { status: 200, headers: { ...txtHeaders(), ...cacheableHeaders(), "X-Robots-Tag": NOINDEX_FOLLOW, ...(contentLocation ? { "Content-Location": absoluteUrl(contentLocation) } : {}) } });

// Honest 503 for plain-text documents: never cached as complete, keeps advertising retrieval surface.
export const txtUnavailableResponse = (body: string) =>
  new Response(body, { status: 503, headers: { ...txtHeaders(), ...unavailableHeaders() } });

// --- Sitemap responses ---

export const sitemapResponse = (xml: string) =>
  new Response(xml, { status: 200, headers: { ...sitemapHeaders(), ...cacheableHeaders() } });

export const sitemapUnavailableResponse = () =>
  new Response('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap is temporarily unavailable.</error>', {
    status: 503,
    headers: { ...sitemapHeaders(), ...unavailableHeaders() },
  });

// --- HTML document headers ---

// Content-Language per negotiated locale, Vary naming the cookie + Accept-Language inputs so a
// shared cache keys each variant separately.
export const documentHeaders = (preferredLanguage: string): Readonly<Record<string, string>> => ({
  ...baseMachineHeaders(),
  "Content-Language": preferredLanguage,
  Vary: LANGUAGE_VARY,
});

// --- Markdown twin response builders ---

// Success headers shared by every Markdown twin: same robots directive as HTML heads
// (INDEXABLE_ROBOTS), same cache policy, Content-Language per locale, Vary for cookie +
// Accept-Language.
export const mdHeaders = (preferredLanguage: PreferredLanguage): Readonly<Record<string, string>> => ({
  ...baseMachineHeaders(),
  "Content-Type": "text/markdown; charset=utf-8",
  "Cache-Control": CACHE_CONTROL,
  "Content-Language": preferredLanguage,
  Vary: LANGUAGE_VARY,
  "X-Robots-Tag": INDEXABLE_ROBOTS,
});

// Failure base: twin headers with no-store/noindex overrides; AI-index ads survive so an outage
// is never a dead end for a crawler.
export const mdUnavailableHeaders = (preferredLanguage: PreferredLanguage) => ({
  ...mdHeaders(preferredLanguage),
  ...unavailableHeaders(),
  Link: AI_INDEX_LINK_HEADER,
});

// Canonical + language variants + AI indexes in the Link header, built once from the shared
// declaration so twins and HTML can never disagree.
export const markdownLinks = (canonical: string, markdownUrl: string) =>
  joinLinkHeader([{ rel: "canonical", href: canonical }, ...AI_INDEX_LINKS, ...languageVariantLinks(markdownUrl)]);

// Successful Markdown twin (200): Content-Location + Link advertise stable language variants
// and both AI indexes so a crawler landing on any twin walks the full graph from HTTP alone.
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

// Missing slug: still Markdown, parseable 404. Keeps AI-index ads so a crawler on a dead slug
// can walk to the live graph. Content-Location omitted when the path never parsed.
export const mdNotFoundResponse = (body: string, preferredLanguage: PreferredLanguage, markdownPath: Option.Option<string>) => {
  const location = Option.map(markdownPath, (path) => ({ "Content-Location": markdownTwinUrl(path, preferredLanguage) }));

  return new Response(body, {
    status: 404,
    headers: {
      ...mdUnavailableHeaders(preferredLanguage),
      ...Option.getOrElse(location, () => ({})),
    },
  });
};

// 503 for incomplete documents: never cached as complete, keeps advertising retrieval surface.
export const mdUnavailableResponse = (body: string, preferredLanguage: PreferredLanguage) =>
  new Response(body, { status: 503, headers: mdUnavailableHeaders(preferredLanguage) });
