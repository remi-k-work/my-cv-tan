// services, features, and other libraries
import { Effect, Option } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { requireData } from "@/features/data/domain";
import { Data } from "@/features/data/services/data";
import { buildSitemapXml, sitemapResponse, sitemapUnavailableResponse } from "../domain";

// Sitemap endpoint: fetch -> require -> build -> respond, with the shared unavailable-data
// recovery. The pipeline lives with the builders it serves so the route stays a one-liner
// like the robots and Markdown endpoints.
export const sitemapHandler = () =>
  RuntimeServer.runPromise(
    Effect.gen(function* () {
      const data = yield* Data;

      // English bundle: both language variants are served from the same canonical URLs
      const experienceList = yield* requireData(yield* data.experienceList(Option.some("en")), "experience list");
      return sitemapResponse(buildSitemapXml(experienceList));
    }).pipe(
      // A broken dataset must answer 503, never an incomplete crawlable sitemap
      Effect.catchTag("RequiredDataError", (error) =>
        Effect.gen(function* () {
          yield* Effect.logError(`[SITEMAP.XML]: ${error.message}`);
          return sitemapUnavailableResponse();
        })
      )
    )
  );
