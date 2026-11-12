// services, features, and other libraries
import { Context, Effect, Layer, Option } from "effect";
import { Datasets } from "@/features/data/services/datasets";
import { requestPreferredLanguage } from "@/features/data/services/request-language";
import { recoverDataFailure } from "@/features/data/domain/required";
import { experienceFromList } from "@/features/experience/domain/helpers";
import { experienceMarkdownPath } from "@/features/meta/domain/urls";
import { experienceSeo } from "@/features/meta/domain/seo";
import { txtResponse, txtUnavailableResponse } from "@/features/meta/domain/responses";
import { buildExperienceMd, buildNotFoundMd } from "@/features/markdown/domain/detail-twin";
import { twinDocument } from "@/features/markdown/domain/format";
import { buildLlmsFullTxt, buildLlmsTxt, unavailableIndexBody } from "@/features/markdown/domain/indexes";
import { unavailableMarkdownBody } from "@/features/markdown/domain/twins";
import { documentName, parseLangParam, slugFromMdPathname } from "./request";
import { mdNotFoundResponse, mdResponse, mdUnavailableResponse, pinCacheVariant, withoutCaching } from "./responses";
import { resolveTranslation } from "./translation";

// types
import type { PagePath } from "@/domain/models";
import type { RequiredDataError } from "@/features/data/domain/required";
import type { MarkdownTwin, TwinContext } from "@/features/markdown/domain/models";

type DocumentBody = (request: Request, context: TwinContext) => Effect.Effect<Response, RequiredDataError, Datasets>;
type Document = (request: Request) => Effect.Effect<Response, never, Datasets>;

// A discovery index answers from content the layer already resolved, so its document carries no
// service requirement of its own — unlike a twin, which resolves its datasets per request
type IndexDocument = (request: Request) => Effect.Effect<Response, never>;

// constants
import { DEFAULT_LANGUAGE } from "@/domain/constants";
import { LLMS_FULL_TXT_INDEX, LLMS_TXT_INDEX } from "@/features/meta/domain/discovery";
import { PAGE_TWINS } from "./pages";

// Handles language resolution, translation snapshot loading, rendering, and failure recovery
const documentResponse = (render: DocumentBody): Document =>
  Effect.fnUntraced(function* (request: Request) {
    const langOverride = parseLangParam(request.url);
    const { context, fallback } = yield* resolveTranslation(requestPreferredLanguage(langOverride));

    const rendered = yield* render(request, context).pipe(
      recoverDataFailure(
        () => `[${documentName(request)}]`,
        () => mdUnavailableResponse(unavailableMarkdownBody(context.translate), context.preferredLanguage)
      )
    );

    // A fallback document is English at a URL that asked for another language: keep it out of
    // shared caches and leave the negotiated Vary in place instead of pinning a misleading variant.
    const stable = fallback ? withoutCaching(rendered) : rendered;

    return Option.isSome(langOverride) && !fallback ? pinCacheVariant(stable) : stable;
  });

const respond = (context: TwinContext, twin: MarkdownTwin, canonical: string, markdownPath: string) =>
  mdResponse({
    body: twinDocument(twin),
    preferredLanguage: context.preferredLanguage,
    canonical,
    markdownPath,
  });

const pageDocument = (pagePath: PagePath) =>
  documentResponse((_request, context) => {
    const twin = PAGE_TWINS[pagePath];

    return Effect.map(twin.document(context), (document) => respond(context, document, twin.entry.canonical, twin.entry.mdHref));
  });

const notFoundTwin = (slug: Option.Option<string>, context: TwinContext) =>
  mdNotFoundResponse(twinDocument(buildNotFoundMd({ slug, ...context })), context.preferredLanguage, Option.map(slug, experienceMarkdownPath));

const experienceTwin: Document = documentResponse(
  Effect.fnUntraced(function* (request: Request, context: TwinContext) {
    // The parsed slug is the 404 subject in both misses, so each branch hands the Option it
    // already holds rather than re-wrapping the value (or an empty one) a second time
    const slug = slugFromMdPathname(request.url);
    if (Option.isNone(slug)) return notFoundTwin(slug, context);

    const slugValue = slug.value;
    const datasets = yield* Datasets;
    const list = yield* datasets.experienceList(context.preferredLanguage);
    const found = experienceFromList(list, slugValue);

    if (Option.isNone(found)) {
      yield* Effect.logDebug(`[SLUG.MD]: no experience for slug "${slugValue}", emitting markdown 404`);
      return notFoundTwin(slug, context);
    }

    const experience = found.value;
    const seo = experienceSeo({ experience, preferredLanguage: context.preferredLanguage });

    return respond(context, buildExperienceMd({ seo, translate: context.translate }), seo.canonical, seo.markdownPath);
  })
);

const discoveryDocument =
  (index: { readonly name: string; readonly url: string }, content: Effect.Effect<string, RequiredDataError>): IndexDocument =>
  (_request: Request) =>
    content.pipe(
      Effect.map((body) => txtResponse(body, index.url)),
      recoverDataFailure(
        () => `[${index.name.toUpperCase()}]`,
        () => txtUnavailableResponse(unavailableIndexBody(index.name))
      )
    );

// The service's callers are document routes, not data pipelines: resolve the datasets once when
// the layer is built so the public method types describe what the service does, not what it reads.
// The indexes are source-language documents, so their content is one projection over those
// resolved accessors rather than a pipeline that looks the service up again per request
export class Markdown extends Context.Service<Markdown>()("Markdown", {
  make: Effect.map(Datasets, (datasets) => {
    const withDatasets = Effect.provideService(Datasets, datasets);

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

    return {
      page: (pagePath: PagePath) => (request: Request) => withDatasets(pageDocument(pagePath)(request)),
      experience: (request: Request) => withDatasets(experienceTwin(request)),
      // The indexes read the resolved accessors directly, so they need no service provided to them
      siteIndex,
      siteIndexFull,
    } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}
