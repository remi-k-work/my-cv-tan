// Crawl-directive documents: robots.txt and dynamic sitemap.xml.

// services, features, and other libraries
import { Effect } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { recoverDataFailure } from "@/features/data/domain/required";
import { Datasets } from "@/features/data/services/datasets";
import { buildSitemapXml, ROBOTS_TXT } from "@/features/meta/domain/discovery";
import { sitemapResponse, sitemapUnavailableResponse, txtResponse } from "@/features/meta/http";

// constants
import { SITE_LANGUAGES } from "@/features/meta/domain/constants";

// Fresh Response body per execution for single-use crawler streams.
const robotsDocument = Effect.sync(() => txtResponse(ROBOTS_TXT));

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

export const robotsHandler = () => RuntimeServer.runPromise(robotsDocument);
export const sitemapHandler = () => RuntimeServer.runPromise(sitemapDocument);
