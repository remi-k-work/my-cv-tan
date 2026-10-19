// services, features, and other libraries
import { Effect, Option } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { recoverDataFailure, requireDataFrom } from "@/features/data/domain/required";
import { Data } from "@/features/data/services/data";
import { buildSitemapXml } from "@/features/meta/domain/sitemap";
import { sitemapResponse, sitemapUnavailableResponse } from "@/features/meta/domain/response";

// Pure document pipeline, one run per request: fetch -> require -> build -> respond. Shared data-failure
// recovery answers 503 instead of ever emitting an incomplete crawlable sitemap
export const sitemapDocument = Effect.gen(function* () {
  const data = yield* Data;

  // English bundle: both language variants are served from the same canonical URLs
  const experienceList = yield* requireDataFrom(data.experienceList(Option.some("en")), "experience list");
  return sitemapResponse(buildSitemapXml(experienceList));
}).pipe(
  // Lazy fallback: a fresh 503 Response is built only when a request actually fails
  recoverDataFailure("[SITEMAP.XML]", sitemapUnavailableResponse)
);

// Route wiring only: the same pure-Effect-plus-thin-bridge shape the Markdown service uses,
// so the pipeline stays independently testable and the router never touches Effect internals
export const sitemapHandler = () => RuntimeServer.runPromise(sitemapDocument);
