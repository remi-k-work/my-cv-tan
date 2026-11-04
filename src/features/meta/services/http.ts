// Shared headers and responses for HTML and machine-readable routes.

// services, features, and other libraries
import { Effect, Option } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { recoverDataFailure } from "@/features/data/domain/required";
import { Datasets } from "@/features/data/services/datasets";

// types
import { PreferredLanguage } from "@/domain/models";

// constants
import { INDEXABLE_ROBOTS, NOINDEX_FOLLOW, NO_STORE } from "@/domain/http";
import { CONTENT_SIGNAL, SITE_LANGUAGES } from "../domain/constants";
import { AI_INDEX_LINK_HEADER, AI_INDEX_LINKS, canonicalLink, joinLinkHeader, languageVariantLinks, markdownTwinUrl } from "../domain/links";
import { ROBOTS_TXT, SITEMAP_UNAVAILABLE_XML, buildSitemapXml } from "../domain/discovery";

const CACHE_CONTROL = "public, max-age=3600, stale-while-revalidate=86400";
const TXT_CONTENT_TYPE = "text/plain; charset=utf-8";
const XML_CONTENT_TYPE = "application/xml; charset=utf-8";
const MD_CONTENT_TYPE = "text/markdown; charset=utf-8";

// Language-negotiated documents must vary on both inputs.
export const LANGUAGE_VARY = "Cookie, Accept-Language";

// The reuse signal and AI-index advertisements every response repeats.
const MACHINE_HEADERS = { "Content-Signal": CONTENT_SIGNAL, Link: AI_INDEX_LINK_HEADER } as const;
// A successful representation may be cached; a failure never is.
const CACHEABLE_HEADERS = { "Cache-Control": CACHE_CONTROL } as const;
// Documents crawlers may read but must not list as results, while still following their links.
const NOINDEX_HEADERS = { "X-Robots-Tag": NOINDEX_FOLLOW } as const;
const UNAVAILABLE_HEADERS = { "Cache-Control": NO_STORE, ...NOINDEX_HEADERS } as const;
// Indexable documents opt into full snippets and large previews.
const INDEXABLE_HEADERS = { "X-Robots-Tag": INDEXABLE_ROBOTS } as const;

const TXT_HEADERS = { ...MACHINE_HEADERS, "Content-Type": TXT_CONTENT_TYPE, "Content-Language": "en" } as const;
const SITEMAP_HEADERS = { ...MACHINE_HEADERS, "Content-Type": XML_CONTENT_TYPE } as const;

export const txtResponse = (body: string) => new Response(body, { status: 200, headers: { ...TXT_HEADERS, ...CACHEABLE_HEADERS } });

export const txtUnavailableResponse = (body: string) => new Response(body, { status: 503, headers: { ...TXT_HEADERS, ...UNAVAILABLE_HEADERS } });

export const discoveryTxtResponse = (body: string, contentLocation: string) =>
  new Response(body, {
    status: 200,
    headers: { ...TXT_HEADERS, ...CACHEABLE_HEADERS, ...NOINDEX_HEADERS, "Content-Location": contentLocation },
  });

export const sitemapResponse = (xml: string) =>
  new Response(xml, { status: 200, headers: { ...SITEMAP_HEADERS, ...CACHEABLE_HEADERS, ...NOINDEX_HEADERS } });

export const sitemapUnavailableResponse = () =>
  new Response(SITEMAP_UNAVAILABLE_XML, { status: 503, headers: { ...SITEMAP_HEADERS, ...UNAVAILABLE_HEADERS } });

export const documentHeaders = (preferredLanguage: PreferredLanguage): Readonly<Record<string, string>> => ({
  ...MACHINE_HEADERS,
  "Content-Language": preferredLanguage,
  Vary: LANGUAGE_VARY,
});

// Body headers every Markdown response shares, before its outcome is layered on.
const markdownHeaders = (preferredLanguage: PreferredLanguage) => ({
  ...MACHINE_HEADERS,
  "Content-Type": MD_CONTENT_TYPE,
  "Content-Language": preferredLanguage,
  Vary: LANGUAGE_VARY,
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
      ...markdownHeaders(input.preferredLanguage),
      ...CACHEABLE_HEADERS,
      ...INDEXABLE_HEADERS,
      "Content-Location": markdownUrl,
      Link: markdownLinks(input.canonical, markdownUrl),
    },
  });
};

export const mdNotFoundResponse = (body: string, preferredLanguage: PreferredLanguage, markdownPath: Option.Option<string>) => {
  const location = Option.isSome(markdownPath) ? { "Content-Location": markdownTwinUrl(markdownPath.value, preferredLanguage) } : undefined;

  return new Response(body, { status: 404, headers: { ...markdownHeaders(preferredLanguage), ...UNAVAILABLE_HEADERS, ...location } });
};

export const mdUnavailableResponse = (body: string, preferredLanguage: PreferredLanguage) =>
  new Response(body, { status: 503, headers: { ...markdownHeaders(preferredLanguage), ...UNAVAILABLE_HEADERS } });

// --- Route handlers ---

// robots.txt is a static document: no datasets, no async work — serve it directly.
export const robotsHandler = () => txtResponse(ROBOTS_TXT);

// Include experience slugs from every language; the XML builder deduplicates canonical URLs.
const sitemapDocument = Effect.gen(function* () {
  const { experienceList } = yield* Datasets;
  const lists = yield* Effect.all(SITE_LANGUAGES.map((language) => experienceList(language)), { concurrency: "unbounded" });

  const slugs = lists.flatMap((list) => list.map(({ slug }) => slug));

  return sitemapResponse(buildSitemapXml(slugs));
}).pipe(
  Effect.provide(Datasets.layer),
  recoverDataFailure("[SITEMAP.XML]", sitemapUnavailableResponse),
  Effect.withSpan("sitemapDocument")
);

export const sitemapHandler = () => RuntimeServer.runPromise(sitemapDocument);
