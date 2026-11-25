// services, features, and other libraries
import { Context, Effect, Layer } from "effect";
import { recoverDataFailure } from "@/features/data/domain/required";
import { Datasets } from "@/features/data/services/datasets";
import { buildSitemapXml } from "@/features/meta/domain/sitemap";
import { sitemapResponse, sitemapUnavailableResponse } from "./responses";

// constants
import { DEFAULT_LANGUAGE } from "@/domain/constants";

// Encapsulates sitemap XML generation against the Datasets service for testability and runtime composition
export class Sitemap extends Context.Service<Sitemap>()("my-cv-v4-tan/features/meta/services/Sitemap", {
  make: Effect.gen(function* () {
    const { experienceList } = yield* Datasets;

    // Localized experience assets guarantee identical unique slugs across languages, so one default-language read suffices
    const document = Effect.map(experienceList(DEFAULT_LANGUAGE), (experiences) => sitemapResponse(buildSitemapXml(experiences))).pipe(
      recoverDataFailure(() => "[SITEMAP.XML]", sitemapUnavailableResponse),
      Effect.withSpan("Sitemap.document")
    );

    return { document } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}
