// services, features, and other libraries
import { Effect, Option } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { recoverDataFailure, requireData } from "@/features/data/domain";
import { Data } from "@/features/data/services/data";
import { buildSitemapXml, sitemapResponse, sitemapUnavailableResponse } from "@/features/meta/domain";

// Sitemap pipeline: fetch -> require -> build -> respond; shared data-failure recovery
// answers 503 instead of ever emitting an incomplete crawlable sitemap
const sitemapResponseEffect = Effect.gen(function* () {
  const data = yield* Data;

  // English bundle: both language variants are served from the same canonical URLs
  const experienceList = yield* requireData(yield* data.experienceList(Option.some("en")), "experience list");
  return sitemapResponse(buildSitemapXml(experienceList));
}).pipe(recoverDataFailure("[SITEMAP.XML]", sitemapUnavailableResponse()));

// Thin bridge between the router and the Effect runtime, matching the Markdown twin handlers
export const sitemapHandler = () => RuntimeServer.runPromise(sitemapResponseEffect);
