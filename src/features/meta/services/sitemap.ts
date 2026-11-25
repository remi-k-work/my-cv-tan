// services, features, and other libraries
import { Effect } from "effect";
import { documentRoute } from "@/lib/server-route";
import { recoverDataFailure } from "@/features/data/domain/required";
import { Datasets } from "@/features/data/services/datasets";
import { buildSitemapXml } from "@/features/meta/domain/sitemap";
import { sitemapResponse, sitemapUnavailableResponse } from "./responses";

// constants
import { DEFAULT_LANGUAGE } from "@/domain/constants";

// Localized experience assets already guarantee the same unique slugs in every available language
// One source-language read therefore describes every canonical route without a redundant dataset
// dependency; buildSitemapXml still dedupes against the static paths at its own boundary
export const sitemapDocument = Effect.gen(function* () {
  const { experienceList } = yield* Datasets;
  const experiences = yield* experienceList(DEFAULT_LANGUAGE);
  return sitemapResponse(buildSitemapXml(experiences));
}).pipe(
  recoverDataFailure(() => "[SITEMAP.XML]", sitemapUnavailableResponse),
  Effect.withSpan("sitemapDocument")
);

export const sitemapHandler = documentRoute(() => sitemapDocument);
