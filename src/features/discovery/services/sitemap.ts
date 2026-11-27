// services, features, and other libraries
import { Context, Effect, Layer } from "effect";
import { recoverDataFailure } from "@/features/data/domain/required";
import { Datasets } from "@/features/data/services/datasets";
import { buildSitemapXml } from "@/features/discovery/domain/sitemap";
import { sitemapResponse, sitemapUnavailableResponse } from "@/lib/http-response";

// constants
import { DEFAULT_LANGUAGE } from "@/domain/constants";

// Encapsulates sitemap XML generation against the Datasets service for testability and runtime composition
export class Sitemap extends Context.Service<
  Sitemap,
  {
    readonly document: Effect.Effect<Response>;
  }
>()("my-cv-v4-tan/features/discovery/services/Sitemap") {
  static readonly layer = Layer.effect(
    Sitemap,
    Effect.gen(function* () {
      const { experienceList } = yield* Datasets;

      // Localized experience assets guarantee identical unique slugs across languages, so one default-language read suffices
      const document = experienceList(DEFAULT_LANGUAGE).pipe(
        Effect.map((experiences) => sitemapResponse(buildSitemapXml(experiences))),
        recoverDataFailure(() => "[SITEMAP.XML]", sitemapUnavailableResponse),
        Effect.withSpan("Sitemap.document")
      );

      return Sitemap.of({ document });
    })
  );
}
