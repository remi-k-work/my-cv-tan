// services, features, and other libraries
import { Context, Effect, Layer, String } from "effect";
import { Datasets } from "@/features/data/services/datasets";
import { recoverDataFailure } from "@/features/data/domain/required";
import { txtResponse, txtUnavailableResponse } from "@/lib/http-response";
import { buildLlmsFullTxt, buildLlmsTxt, unavailableIndexBody } from "@/features/discovery/domain/llms";

// types
import type { RequiredDataError } from "@/features/data/domain/required";

type Document = (request: Request) => Effect.Effect<Response>;

// constants
import { DEFAULT_LANGUAGE } from "@/domain/constants";
import { LLMS_FULL_TXT_INDEX, LLMS_TXT_INDEX } from "@/domain/discovery";

// Wraps a source-language document body in the discovery response policy, recovering a data outage
// as a non-cacheable 503 that still names the retrieval location
const discoveryDocument =
  (index: { readonly name: string; readonly url: string }, content: Effect.Effect<string, RequiredDataError>): Document =>
  (_request: Request) =>
    content.pipe(
      Effect.map((body) => txtResponse(body, index.url)),
      recoverDataFailure(
        () => `[${String.toUpperCase(index.name)}]`,
        () => txtUnavailableResponse(unavailableIndexBody(index.name), index.url)
      ),
      Effect.withSpan("Discovery.discovery", { attributes: { document: index.name } })
    );

// Encapsulates the AI discovery indexes against the Datasets service for testability and runtime composition
export class Discovery extends Context.Service<
  Discovery,
  {
    readonly siteIndex: Document;
    readonly siteIndexFull: Document;
  }
>()("my-cv-v4-tan/features/discovery/services/Discovery") {
  static readonly layer = Layer.effect(
    Discovery,
    Effect.gen(function* () {
      const datasets = yield* Datasets;

      // Discovery indexes are unilingual English documents; re-read the datasets on every request
      const siteIndex = discoveryDocument(LLMS_TXT_INDEX, Effect.map(datasets.experienceList(DEFAULT_LANGUAGE), buildLlmsTxt));

      const siteIndexFull = discoveryDocument(
        LLMS_FULL_TXT_INDEX,
        Effect.map(
          Effect.all(
            {
              pageTitles: datasets.pageTitles(DEFAULT_LANGUAGE),
              experienceList: datasets.experienceList(DEFAULT_LANGUAGE),
              educationList: datasets.educationList(DEFAULT_LANGUAGE),
            },
            { concurrency: "unbounded" }
          ),
          buildLlmsFullTxt
        )
      );

      return Discovery.of({ siteIndex, siteIndexFull });
    })
  );
}
