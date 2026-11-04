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
import { CONTENT_SIGNAL, CRAWL_DELAY, DOWNLOADABLE_DOCUMENTS, SITE_LANGUAGES, SITEMAP_HREF } from "../domain/constants";
import { STATIC_PAGE_PATHS } from "../domain/pages";
import {
  AI_INDEX_LINK_HEADER,
  AI_INDEX_LINKS,
  absoluteUrl,
  canonicalLink,
  experiencePath,
  joinLinkHeader,
  languageVariantLinks,
  markdownTwinUrl,
} from "../domain/links";

// --- Crawl directives (robots.txt) ---

const AI_SEARCH_CRAWLERS = ["OAI-SearchBot", "Claude-SearchBot", "PerplexityBot", "YouBot", "DuckAssistBot"] as const;
const AI_USER_CRAWLERS = ["ChatGPT-User", "Claude-User", "Perplexity-User", "Meta-ExternalFetcher", "MistralAI-User"] as const;
const AI_DATASET_CRAWLERS = [
  "GPTBot",
  "ClaudeBot",
  "DeepSeekBot",
  "CCBot",
  "Google-Extended",
  "Applebot-Extended",
  "Amazonbot",
  "Meta-ExternalAgent",
  "AI2Bot",
  "cohere-training-data-crawler",
  "Bytespider",
  "Timpibot",
  "ImagesiftBot",
] as const;

const CONTENT_DIRECTIVES = [
  "Allow: /",
  "Allow: /*.md",
  "Disallow: /api",
  `Content-Signal: ${CONTENT_SIGNAL}`,
  `Crawl-delay: ${CRAWL_DELAY}`,
] as const;

const crawlerGroup = (comment: string, bots: ReadonlyArray<string>) =>
  bots.flatMap((bot) => [`# ${comment}`, `User-agent: ${bot}`, ...CONTENT_DIRECTIVES, ""]);

export const ROBOTS_TXT = [
  ...crawlerGroup("Every crawler: the HTML pages and their Markdown twins", ["*"]),
  ...crawlerGroup("Explicitly allow AI search crawlers on HTML and Markdown twins", AI_SEARCH_CRAWLERS),
  ...crawlerGroup("User-initiated AI browsing is also allowed", AI_USER_CRAWLERS),
  ...crawlerGroup("Training and dataset crawlers are also currently allowed", AI_DATASET_CRAWLERS),
  "# See /llms.txt for the Markdown page index",
  `Sitemap: ${absoluteUrl(SITEMAP_HREF)}`,
  "",
].join("\n");

// --- Sitemap XML ---

// Static pages come from the shared catalogue; downloads are exactly the advertised documents.
const STATIC_URLS = [...STATIC_PAGE_PATHS, ...DOWNLOADABLE_DOCUMENTS.map(({ href }) => href)].map(absoluteUrl);
const XML_ENTITIES: Readonly<Record<string, string>> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };
const escapeXml = (value: string) => value.replace(/[&<>"']/g, (character) => XML_ENTITIES[character] ?? character);

// No lastmod is emitted: authored dates are display strings, not trustworthy modification times.
export const buildSitemapXml = (slugs: ReadonlyArray<string>) => {
  const locs = new Set([...STATIC_URLS, ...slugs.map((slug) => absoluteUrl(experiencePath(slug)))]);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...Array.from(locs, (loc) => `<url><loc>${escapeXml(loc)}</loc></url>`),
    "</urlset>",
  ].join("\n");
};

const CACHE_CONTROL = "public, max-age=3600, stale-while-revalidate=86400";
const TXT_CONTENT_TYPE = "text/plain; charset=utf-8";
const XML_CONTENT_TYPE = "application/xml; charset=utf-8";
const MD_CONTENT_TYPE = "text/markdown; charset=utf-8";

// Language-negotiated documents must vary on both inputs.
export const LANGUAGE_VARY = "Cookie, Accept-Language";

const MACHINE_HEADERS = { "Content-Signal": CONTENT_SIGNAL, Link: AI_INDEX_LINK_HEADER } as const;
const CACHEABLE_HEADERS = { "Cache-Control": CACHE_CONTROL } as const;
const UNAVAILABLE_HEADERS = { "Cache-Control": NO_STORE, "X-Robots-Tag": NOINDEX_FOLLOW } as const;

const TXT_HEADERS = { ...MACHINE_HEADERS, "Content-Type": TXT_CONTENT_TYPE, "Content-Language": "en" } as const;
const SITEMAP_HEADERS = { ...MACHINE_HEADERS, "Content-Type": XML_CONTENT_TYPE, "X-Robots-Tag": NOINDEX_FOLLOW } as const;

export const txtResponse = (body: string) => new Response(body, { status: 200, headers: { ...TXT_HEADERS, ...CACHEABLE_HEADERS } });

export const txtUnavailableResponse = (body: string) => new Response(body, { status: 503, headers: { ...TXT_HEADERS, ...UNAVAILABLE_HEADERS } });

export const discoveryTxtResponse = (body: string, contentLocation: string) =>
  new Response(body, {
    status: 200,
    headers: { ...TXT_HEADERS, ...CACHEABLE_HEADERS, "X-Robots-Tag": NOINDEX_FOLLOW, "Content-Location": contentLocation },
  });

export const sitemapResponse = (xml: string) => new Response(xml, { status: 200, headers: { ...SITEMAP_HEADERS, ...CACHEABLE_HEADERS } });

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

const headersFor = (preferredLanguage: PreferredLanguage, unavailable = false) => ({
  ...MACHINE_HEADERS,
  "Content-Type": MD_CONTENT_TYPE,
  ...CACHEABLE_HEADERS,
  "Content-Language": preferredLanguage,
  Vary: LANGUAGE_VARY,
  "X-Robots-Tag": INDEXABLE_ROBOTS,
  ...(unavailable ? UNAVAILABLE_HEADERS : {}),
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
    headers: { ...headersFor(input.preferredLanguage), "Content-Location": markdownUrl, Link: markdownLinks(input.canonical, markdownUrl) },
  });
};

export const mdNotFoundResponse = (body: string, preferredLanguage: PreferredLanguage, markdownPath: Option.Option<string>) => {
  const location = Option.isSome(markdownPath) ? { "Content-Location": markdownTwinUrl(markdownPath.value, preferredLanguage) } : undefined;

  return new Response(body, { status: 404, headers: { ...headersFor(preferredLanguage, true), ...location } });
};

export const mdUnavailableResponse = (body: string, preferredLanguage: PreferredLanguage) =>
  new Response(body, { status: 503, headers: headersFor(preferredLanguage, true) });

// --- Route handlers ---

// robots.txt is a static document: no datasets, no async work — serve it directly.
export const robotsHandler = () => txtResponse(ROBOTS_TXT);

// Include experience slugs from every language; the XML builder deduplicates canonical URLs.
const sitemapDocument = Effect.gen(function* () {
  const { experienceList } = yield* Datasets;
  const lists = yield* Effect.all(SITE_LANGUAGES.map(experienceList), { concurrency: "unbounded" });

  const slugs = lists.flatMap((list) => list.map(({ slug }) => slug));

  return sitemapResponse(buildSitemapXml(slugs));
}).pipe(
  Effect.provide(Datasets.layer),
  recoverDataFailure("[SITEMAP.XML]", sitemapUnavailableResponse),
  Effect.withSpan("sitemapDocument")
);

export const sitemapHandler = () => RuntimeServer.runPromise(sitemapDocument);
