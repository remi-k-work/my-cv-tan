// services, features, and other libraries
import { Context, Effect, Layer, Option, Record, String } from "effect";
import { Datasets } from "@/features/data/services/datasets";
import { requestPreferredLanguage } from "@/features/data/services/request-language";
import { recoverDataFailure } from "@/features/data/domain/required";
import { experienceFromList } from "@/features/experience/domain/helpers";
import { experienceMarkdownPath } from "@/features/meta/domain/urls";
import { experienceSeo } from "@/features/meta/domain/seo";
import { txtResponse, txtUnavailableResponse } from "@/features/meta/services/responses";
import { buildExperienceMd } from "@/features/markdown/domain/detail-twin";
import { buildNotFoundMd, unavailableMarkdownBody } from "@/features/markdown/domain/fallback";
import { twinDocument } from "@/features/markdown/domain/format";
import { buildLlmsFullTxt, buildLlmsTxt, unavailableIndexBody } from "@/features/markdown/domain/indexes";
import { documentName, parseLangParam, slugFromMdPathname } from "./request";
import { mdNotFoundResponse, mdResponse, mdUnavailableResponse, pinCacheVariant, withoutCaching } from "./responses";
import { Translation } from "./translation";

// types
import type { PagePath, PreferredLanguage } from "@/domain/models";
import type { RequiredDataError } from "@/features/data/domain/required";
import type { MarkdownTwin, TwinContext } from "@/features/markdown/domain/models";

type DocumentBody = (request: Request, context: TwinContext) => Effect.Effect<Response, RequiredDataError, Datasets>;
type Document = (request: Request) => Effect.Effect<Response, never, Datasets>;

// Discovery indexes close over their dataset accessors, so their public effects need no context.
type IndexDocument = (request: Request) => Effect.Effect<Response, never>;

// constants
import { DEFAULT_LANGUAGE } from "@/domain/constants";
import { LLMS_FULL_TXT_INDEX, LLMS_TXT_INDEX } from "@/features/meta/domain/discovery";
import { PAGE_TWINS } from "./pages";

const applyRepresentationPolicy = (response: Response, fallback: boolean, langOverride: Option.Option<PreferredLanguage>) => {
  // A fallback is temporary negotiated content, so it must bypass both caching and language pinning.
  if (fallback) return withoutCaching(response);

  return Option.match(langOverride, {
    onNone: () => response,
    onSome: () => pinCacheVariant(response),
  });
};

const documentResponse = (translation: Translation["Service"], render: DocumentBody): Document =>
  Effect.fn("Markdown.document")(function* (request: Request) {
    const langOverride = parseLangParam(request.url);
    const { context, fallback } = yield* translation.resolve(requestPreferredLanguage(langOverride));

    const rendered = yield* render(request, context).pipe(
      recoverDataFailure(
        () => `[${documentName(request.url)}]`,
        () => mdUnavailableResponse(unavailableMarkdownBody(context.translate), context.preferredLanguage)
      )
    );

    return applyRepresentationPolicy(rendered, fallback, langOverride);
  });

const respond = (context: TwinContext, twin: MarkdownTwin, canonical: string, markdownPath: string) =>
  mdResponse({
    body: twinDocument(twin),
    preferredLanguage: context.preferredLanguage,
    canonical,
    markdownPath,
  });

const pageDocument = (translation: Translation["Service"], pagePath: PagePath) =>
  documentResponse(translation, (_request, context) => {
    const twin = PAGE_TWINS[pagePath];

    return Effect.map(twin.document(context), (document) => respond(context, document, twin.entry.canonical, twin.entry.mdHref));
  });

const notFoundTwin = (slug: Option.Option<string>, context: TwinContext) =>
  mdNotFoundResponse(twinDocument(buildNotFoundMd({ slug, ...context })), context.preferredLanguage, Option.map(slug, experienceMarkdownPath));

const experienceDocument = (translation: Translation["Service"]): Document =>
  documentResponse(
    translation,
    Effect.fn("Markdown.experience")(function* (request: Request, context: TwinContext) {
      // Reuse the parsed slug as the subject of both 404 branches
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
        () => `[${String.toUpperCase(index.name)}]`,
        () => txtUnavailableResponse(unavailableIndexBody(index.name))
      ),
      Effect.withSpan("Markdown.discovery", { attributes: { document: index.name } })
    );

// Resolve dependencies once; every document request still reads fresh data
export class Markdown extends Context.Service<Markdown>()("my-cv-v4-tan/features/markdown/services/Markdown", {
  make: Effect.gen(function* () {
    const datasets = yield* Datasets;
    const translation = yield* Translation;
    const withDatasets = Effect.provideService(Datasets, datasets);
    const experience = experienceDocument(translation);
    // Build each page pipeline once instead of allocating a new Effect.fn wrapper on every request
    const pages = Record.map(PAGE_TWINS, (_twin, pagePath) => {
      const document = pageDocument(translation, pagePath);
      return (request: Request) => withDatasets(document(request));
    });

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
      page: (pagePath: PagePath) => pages[pagePath],
      experience: (request: Request) => withDatasets(experience(request)),
      siteIndex,
      siteIndexFull,
    } as const;
  }),
}) {
  // Translation is supplied at composition so tests and alternate runtimes can replace its snapshot loader
  static readonly layer = Layer.effect(this, this.make);
}
