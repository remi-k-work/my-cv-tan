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

// Pure document pipeline, one run per request: fetch -> require -> build -> respond. Shared data-failure
// recovery answers 503 instead of ever emitting an incomplete crawlable sitemap
export const sitemapDocument = Effect.gen(function* () {
  const data = yield* Data;

  const sourceList = yield* requireDataFrom(data.experienceList(Option.some(sourceLanguage)), "experience list");
  const translatedList = yield* requireDataFrom(data.experienceList(Option.some(translatedLanguage)), "experience list (translated)");

  return sitemapResponse(buildSitemapXml(Array.unionWith(sourceList, translatedList, (a, b) => a.slug === b.slug)));
}).pipe(
  // Lazy fallback: a fresh 503 Response is built only when a request actually fails
  recoverDataFailure("[SITEMAP.XML]", sitemapUnavailableResponse)
);

// Route wiring only: the same pure-Effect-plus-thin-bridge shape the Markdown service uses,
// so the pipeline stays independently testable and the router never touches Effect internals
export const sitemapHandler = () => RuntimeServer.runPromise(sitemapDocument);
