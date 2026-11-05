// Discovery document responses (robots.txt, sitemap.xml, and the plain-text envelopes the
// AI discovery indexes are served through) and their route handlers. The shared header
// vocabulary lives in ./headers; the Markdown twins' own envelopes live in the markdown feature.

// services, features, and other libraries
import { Effect } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { recoverDataFailure } from "@/features/data/domain/required";
import { Datasets } from "@/features/data/services/datasets";

// headers
import { CACHEABLE_HEADERS, MACHINE_HEADERS, NOINDEX_HEADERS, UNAVAILABLE_HEADERS } from "./headers";

// constants
import { SITE_LANGUAGES } from "../domain/constants";
import { ROBOTS_TXT, SITEMAP_UNAVAILABLE_XML, buildSitemapXml } from "../domain/discovery";

const TXT_CONTENT_TYPE = "text/plain; charset=utf-8";
const XML_CONTENT_TYPE = "application/xml; charset=utf-8";

const TXT_HEADERS = { ...MACHINE_HEADERS, "Content-Type": TXT_CONTENT_TYPE, "Content-Language": "en" } as const;
const SITEMAP_HEADERS = { ...MACHINE_HEADERS, "Content-Type": XML_CONTENT_TYPE } as const;

export const txtResponse = (body: string) => new Response(body, { status: 200, headers: { ...TXT_HEADERS, ...CACHEABLE_HEADERS } });

export const txtUnavailableResponse = (body: string) => new Response(body, { status: 503, headers: { ...TXT_HEADERS, ...UNAVAILABLE_HEADERS } });

// The AI discovery indexes: cacheable on success, but guidance documents, never search results.
export const discoveryTxtResponse = (body: string, contentLocation: string) =>
  new Response(body, {
    status: 200,
    headers: { ...TXT_HEADERS, ...CACHEABLE_HEADERS, ...NOINDEX_HEADERS, "Content-Location": contentLocation },
  });

export const sitemapResponse = (xml: string) =>
  new Response(xml, { status: 200, headers: { ...SITEMAP_HEADERS, ...CACHEABLE_HEADERS, ...NOINDEX_HEADERS } });

export const sitemapUnavailableResponse = () =>
  new Response(SITEMAP_UNAVAILABLE_XML, { status: 503, headers: { ...SITEMAP_HEADERS, ...UNAVAILABLE_HEADERS } });

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
