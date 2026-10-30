// services, features, and other libraries
import { Array, Effect, Option } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { recoverDataFailure, requireDataFrom } from "@/features/data/domain/required";
import { Data } from "@/features/data/services/data";
import { buildSitemapXml } from "@/features/meta/domain/sitemap";
import { sitemapResponse, sitemapUnavailableResponse } from "@/features/meta/domain/response";

// constants
import { SITE_LANGUAGES } from "@/features/meta/domain/constants";

// Unpack supported languages: sitemap indexes all valid localized slugs across English and Polish
const [sourceLanguage, translatedLanguage] = SITE_LANGUAGES;

// Pure document pipeline: reads both localized lists, deduplicates slugs, and handles errors with 503
export const sitemapDocument: Effect.Effect<Response, never, Data> = Effect.gen(function* () {
  const data = yield* Data;

  // Both lookups read the already-decoded in-memory assets, so they resolve
  // synchronously: the default sequential Effect.all runs them without forking fibers
  const [sourceList, translatedList] = yield* Effect.all([
    requireDataFrom(data.experienceList(Option.some(sourceLanguage)), "experience list"),
    requireDataFrom(data.experienceList(Option.some(translatedLanguage)), "experience list (translated)"),
  ]);

  // Union by slug guarantees both localized variants and unique items are crawlable without duplicates
  return sitemapResponse(buildSitemapXml(Array.unionWith(sourceList, translatedList, (a, b) => a.slug === b.slug)));
}).pipe(
  // Transient failure returns 503 with no-store to avoid poisoning search engine caches with incomplete sitemaps
  recoverDataFailure("[SITEMAP.XML]", sitemapUnavailableResponse)
);

// Thin adapter executing the Effect pipeline on the application managed server runtime
export const sitemapHandler = () => RuntimeServer.runPromise(sitemapDocument);
