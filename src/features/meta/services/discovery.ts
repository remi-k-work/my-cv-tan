// Crawl-directive documents: robots.txt and dynamic sitemap.xml.
import { Array, Effect, pipe } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { recoverDataFailure } from "@/features/data/domain/required";
import { Datasets } from "@/features/meta/services/datasets";
import { buildSitemapXml } from "@/features/meta/domain/sitemap";
import { ROBOTS_TXT } from "@/features/meta/domain/robots";
import { sitemapResponse, sitemapUnavailableResponse, txtResponse } from "@/features/meta/domain/response";
import { SITE_LANGUAGES } from "@/features/meta/domain/constants";

// Fresh Response body per execution for single-use crawler streams.
const robotsDocument = Effect.sync(() => txtResponse(ROBOTS_TXT));

// Sitemap unions unique slugs across all supported languages.
const sitemapDocument = Effect.gen(function* () {
  const { experienceList } = yield* Datasets;
  const lists = yield* Effect.all(Array.map(SITE_LANGUAGES, experienceList));

  const slugs = pipe(
    lists,
    Array.flatMap((list) => Array.map(list, ({ slug }) => slug)),
    Array.dedupe,
    Array.map((slug) => ({ slug } as const))
  );

  return sitemapResponse(buildSitemapXml(slugs));
}).pipe(
  Effect.provide(Datasets.layer),
  recoverDataFailure("[SITEMAP.XML]", sitemapUnavailableResponse),
  Effect.withSpan("sitemapDocument")
);

const handler = (document: Effect.Effect<Response, never>) => () =>
  RuntimeServer.runPromise(document);

export const robotsHandler = handler(robotsDocument);
export const sitemapHandler = handler(sitemapDocument);
