// Crawl-directive documents: robots.txt and dynamic sitemap.xml.

// services, features, and other libraries
import { Array, Effect, pipe } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { recoverDataFailure } from "@/features/data/domain/required";
import { Datasets } from "@/features/meta/services/datasets";
import { buildSitemapXml } from "@/features/meta/domain/sitemap";
import { sitemapResponse, sitemapUnavailableResponse, txtResponse } from "@/features/meta/domain/response";

// constants
import { ROBOTS_TXT } from "@/features/meta/domain/robots";
import { SITE_LANGUAGES } from "@/features/meta/domain/constants";

// Fresh Response body per execution for single-use crawler streams.
const robotsDocument = Effect.sync(() => txtResponse(ROBOTS_TXT));

// Sitemap unions unique slugs across all supported languages.
const sitemapDocument = Effect.gen(function* () {
  const { experienceList } = yield* Datasets;
  const lists = yield* Effect.all(SITE_LANGUAGES.map(experienceList));

  const slugs = pipe(
    lists,
    Array.flatMap((list) => list.map(({ slug }) => slug)),
    Array.dedupe
  );

  return sitemapResponse(buildSitemapXml(slugs));
}).pipe(Effect.provide(Datasets.layer), recoverDataFailure("[SITEMAP.XML]", sitemapUnavailableResponse), Effect.withSpan("sitemapDocument"));

export const robotsHandler = () => RuntimeServer.runPromise(robotsDocument);
export const sitemapHandler = () => RuntimeServer.runPromise(sitemapDocument);
