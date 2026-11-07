// Route handlers for robots.txt and sitemap.xml. Their HTTP response envelopes live in
// ./responses; shared headers live in ./headers. Both are public, visitor-independent documents,
// so both run through the shared document route and strip the negotiation cookie it writes.

// services, features, and other libraries
import { Effect } from "effect";
import { documentRoute } from "@/lib/server-route";
import { recoverDataFailure } from "@/features/data/domain/required";
import { Datasets } from "@/features/data/services/datasets";

// response envelopes
import { sitemapResponse, sitemapUnavailableResponse, txtResponse } from "./responses";

// constants
import { SITE_LANGUAGES } from "@/domain/constants";
import { ROBOTS_TXT } from "../domain/robots";
import { buildSitemapXml } from "../domain/sitemap";

// robots.txt is a static document: no datasets, no async work — but it goes through the same
// plumbing as the sitemap so the strip-visitor-state contract is decided in exactly one place.
export const robotsHandler = documentRoute(() => Effect.succeed(txtResponse(ROBOTS_TXT)));

// Include experience slugs from every language; the XML builder deduplicates canonical URLs.
// The dataset requirement is resolved by the server runtime layer, like every other consumer.
const sitemapDocument = Effect.gen(function* () {
  const { experienceList } = yield* Datasets;
  const lists = yield* Effect.all(
    SITE_LANGUAGES.map((language) => experienceList(language)),
    { concurrency: "unbounded" }
  );

  const slugs = lists.flatMap((list) => list.map(({ slug }) => slug));

  return sitemapResponse(buildSitemapXml(slugs));
}).pipe(recoverDataFailure(() => "[SITEMAP.XML]", sitemapUnavailableResponse), Effect.withSpan("sitemapDocument"));

// The sitemap is one public, visitor-independent document, so its route never keeps the locale
// cookie the negotiation middleware writes.
export const sitemapHandler = documentRoute(() => sitemapDocument);
