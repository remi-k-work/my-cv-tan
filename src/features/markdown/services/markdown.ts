// services, features, and other libraries
import { Context, Effect, Layer, Option, Record } from "effect";
import { Datasets } from "@/features/data/services/datasets";
import { requestPreferredLanguage } from "@/features/data/services/request-language";
import { recoverDataFailure } from "@/features/data/domain/required";
import { experienceFromList } from "@/features/experience/domain/helpers";
import { experienceMarkdownPath } from "@/domain/urls";
import { experienceSeo } from "@/features/experience/domain/seo";
import { buildNotFoundMd, unavailableMarkdownBody } from "@/features/markdown/domain/fallback";
import { twinDocument } from "@/features/markdown/domain/format";
import { buildExperienceMd } from "@/features/markdown/domain/twins";
import { documentName, parseLangParam, slugFromMdPathname } from "./request";
import { applyRepresentationPolicy, mdNotFoundResponse, mdResponse, mdUnavailableResponse } from "./responses";
import { Translation } from "./translation";

// types
import type { PagePath } from "@/domain/models";
import type { RequiredDataError } from "@/features/data/domain/required";
import type { MarkdownTwin, TwinContext } from "@/features/markdown/domain/models";

type DocumentBody = (request: Request, context: TwinContext) => Effect.Effect<Response, RequiredDataError>;
type Document = (request: Request) => Effect.Effect<Response>;

// constants
import { PAGE_TWINS } from "./pages";

const respond = (context: TwinContext, twin: MarkdownTwin, canonical: string, markdownPath: string) =>
  mdResponse({
    body: twinDocument(twin),
    preferredLanguage: context.preferredLanguage,
    canonical,
    markdownPath,
  });

const notFoundTwin = (slug: Option.Option<string>, context: TwinContext) =>
  mdNotFoundResponse(twinDocument(buildNotFoundMd({ slug, ...context })), context.preferredLanguage, Option.map(slug, experienceMarkdownPath));

// Resolve dependencies once; every document request still reads fresh data
export class Markdown extends Context.Service<
  Markdown,
  {
    readonly page: (pagePath: PagePath) => Document;
    readonly experience: Document;
  }
>()("my-cv-v4-tan/features/markdown/services/Markdown") {
  // Translation is supplied at composition so tests and alternate runtimes can replace its snapshot loader
  static readonly layer = Layer.effect(
    Markdown,
    Effect.gen(function* () {
      const datasets = yield* Datasets;
      const translation = yield* Translation;

      const serveDocument = (markdownPath: (request: Request) => Option.Option<string>, render: DocumentBody): Document =>
        Effect.fn("Markdown.document")(function* (request: Request) {
          const langOverride = parseLangParam(request.url);
          const preferredLanguage = yield* Effect.sync(() => requestPreferredLanguage(langOverride));
          const { context, fallback } = yield* translation.resolve(preferredLanguage);

          const rendered = yield* render(request, context).pipe(
            recoverDataFailure(
              () => `[${documentName(request.url)}]`,
              () => mdUnavailableResponse(unavailableMarkdownBody(context.translate), context.preferredLanguage, markdownPath(request))
            )
          );

          return applyRepresentationPolicy(rendered, fallback, langOverride);
        });

      const pages = Record.map(PAGE_TWINS, (twin) =>
        serveDocument(
          () => Option.some(twin.entry.mdHref),
          (_request, context) => Effect.map(twin.document(datasets, context), (document) => respond(context, document, twin.entry.canonical, twin.entry.mdHref))
        )
      );

      const experience = serveDocument(
        (request) => Option.map(slugFromMdPathname(request.url), experienceMarkdownPath),
        Effect.fn("Markdown.experience")(function* (request: Request, context: TwinContext) {
          const slug = slugFromMdPathname(request.url);
          // Reject malformed addresses before reading the portfolio dataset.
          if (Option.isNone(slug)) return notFoundTwin(Option.none(), context);

          const experiences = yield* datasets.experienceList(context.preferredLanguage);
          const item = experienceFromList(experiences, slug.value);
          if (Option.isNone(item)) {
            yield* Effect.logDebug(`[SLUG.MD]: no experience for slug "${slug.value}", emitting markdown 404`);
            return notFoundTwin(slug, context);
          }

          const document = experienceSeo({ experience: item.value, preferredLanguage: context.preferredLanguage });
          return respond(context, buildExperienceMd({ seo: document, translate: context.translate }), document.canonical, document.markdownPath);
        })
      );

      return Markdown.of({
        page: (pagePath: PagePath) => pages[pagePath],
        experience,
      });
    })
  );
}
