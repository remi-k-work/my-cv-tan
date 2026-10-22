// services, features, and other libraries
import { Array, Effect, Option } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { recoverDataFailure, requireDataFrom } from "@/features/data/domain/required";
import { Data } from "@/features/data/services/data";
import { buildSitemapXml } from "@/features/meta/domain/sitemap";
import { sitemapResponse, sitemapUnavailableResponse } from "@/features/meta/domain/response";

// constants
import { SITE_LANGUAGES } from "@/features/meta/domain/constants";

// Each language bundle ships its own list and translations may rename a slug, so the sitemap
// unions both by slug: a page that exists in only one language must still be crawlable
const [sourceLanguage, translatedLanguage] = SITE_LANGUAGES;

// Pure document pipeline, one run per request: fetch concurrently -> require -> build -> respond
// Both language lists are fetched concurrently since language data sets are independent
export const sitemapDocument = Effect.gen(function* () {
  const data = yield* Data;

  // Concurrent fetch of both language lists to minimize TTFB for crawler requests
  const [sourceList, translatedList] = yield* Effect.all(
    [
      requireDataFrom(data.experienceList(Option.some(sourceLanguage)), "experience list"),
      requireDataFrom(data.experienceList(Option.some(translatedLanguage)), "experience list (translated)"),
    ],
    { concurrency: 2 }
  );

  // Union by slug ensures pages with translated slugs or language-specific entries are both crawlable
  return sitemapResponse(buildSitemapXml(Array.unionWith(sourceList, translatedList, (a, b) => a.slug === b.slug)));
}).pipe(
  // Lazy fallback: a fresh 503 Response is minted only when a request actually fails
  recoverDataFailure("[SITEMAP.XML]", sitemapUnavailableResponse)
);

// Route wiring only: thin bridge executing the Effect pipeline on the managed server runtime
export const sitemapHandler = () => RuntimeServer.runPromise(sitemapDocument);
