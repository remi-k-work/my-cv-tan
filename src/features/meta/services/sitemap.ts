// services, features, and other libraries
import { Effect, Option } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { recoverDataFailure, requireData } from "@/features/data/domain";
import { Data } from "@/features/data/services/data";
import { buildSitemapXml, sitemapResponse, sitemapUnavailableResponse } from "@/features/meta/domain";

// Sitemap endpoint: fetch -> require -> build -> respond. Shared data-failure recovery
// keeps the pipeline to a one-liner, matching the Markdown twin handlers.
export const sitemapHandler = () =>
  RuntimeServer.runPromise(
    Effect.gen(function* () {
      const data = yield* Data;

      // English bundle: both language variants are served from the same canonical URLs
      const experienceList = yield* requireData(yield* data.experienceList(Option.some("en")), "experience list");
      return sitemapResponse(buildSitemapXml(experienceList));
      // A broken dataset must answer 503, never an incomplete crawlable sitemap
    }).pipe(recoverDataFailure("[SITEMAP.XML]", sitemapUnavailableResponse()))
  );
