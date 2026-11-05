// Route handlers for robots.txt and sitemap.xml. Their HTTP response envelopes live in
// ./responses; shared headers live in ./headers.

// services, features, and other libraries
import { Effect } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { recoverDataFailure } from "@/features/data/domain/required";
import { Datasets } from "@/features/data/services/datasets";

// response envelopes
import { sitemapResponse, sitemapUnavailableResponse, txtResponse } from "./responses";

// constants
import { SITE_LANGUAGES } from "../domain/constants";
import { ROBOTS_TXT, buildSitemapXml } from "../domain/discovery";

// robots.txt is a static document: no datasets, no async work — serve it directly.
export const robotsHandler = () => txtResponse(ROBOTS_TXT);

// Include experience slugs from every language; the XML builder deduplicates canonical URLs.
// Like the Markdown service, this effect declares its dataset requirement and leaves the layer
// provision to the route-handler boundary, so the pure document stays testable without a layer.
const sitemapDocument = Effect.gen(function* () {
  const { experienceList } = yield* Datasets;
  const lists = yield* Effect.all(
    SITE_LANGUAGES.map((language) => experienceList(language)),
    { concurrency: "unbounded" }
  );

  const slugs = lists.flatMap((list) => list.map(({ slug }) => slug));

  return sitemapResponse(buildSitemapXml(slugs));
}).pipe(recoverDataFailure("[SITEMAP.XML]", sitemapUnavailableResponse), Effect.withSpan("sitemapDocument"));

export const sitemapHandler = () => RuntimeServer.runPromise(Effect.provide(sitemapDocument, Datasets.layer));
