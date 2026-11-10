// services, features, and other libraries
import { Context, Effect, Layer, Option, pipe } from "effect";
import { Datasets } from "@/features/data/services/datasets";
import { requestPreferredLanguage } from "@/features/data/services/request-language";
import { recoverDataFailure } from "@/features/data/domain/required";
import { experienceFromList } from "@/features/experience/domain/helpers";
import { decodeUrlOption, experienceMarkdownPath } from "@/features/meta/domain/urls";
import { translateForLanguage } from "@/lib/gt-translations";
import { mdNotFoundResponse, mdResponse, mdUnavailableResponse, pinCacheVariant } from "./responses";
import { buildExperienceMd, buildNotFoundMd } from "@/features/markdown/domain/detail-twin";
import { twinDocument } from "@/features/markdown/domain/format";
import { buildLlmsFullTxt, buildLlmsTxt, unavailableIndexBody } from "@/features/markdown/domain/indexes";
import { unavailableMarkdownBody } from "@/features/markdown/domain/twins";
import { experienceSeo, txtResponse, txtUnavailableResponse } from "@/features/meta/domain/helpers";
import { translateSource } from "@/domain/helpers";
import { parseLangParam, slugFromMdPathname } from "@/features/markdown/domain/helpers";

// types
import type { LocalizedMdInput, MarkdownTwin, PageTwin } from "@/features/markdown/domain/models";
import type { DatasetsService, LocalizedAccessor } from "@/features/data/services/datasets";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { RequiredDataError } from "@/features/data/domain/required";
import type { PreferredLanguage } from "@/domain/models";

type DocumentBody = (request: Request, context: LocalizedMdInput) => Effect.Effect<Response, RequiredDataError>;

// constants
import { LLMS_FULL_TXT_INDEX, LLMS_TXT_INDEX } from "@/features/meta/domain/constants";
import { CONTACT_TWIN, EDUCATION_TWIN, HOME_TWIN } from "@/features/markdown/domain/constants";
import { DEFAULT_LANGUAGE } from "@/domain/constants";

const translateFor = (preferredLanguage: PreferredLanguage) =>
  preferredLanguage === DEFAULT_LANGUAGE
    ? Effect.succeed(translateSource)
    : Effect.tryPromise(() => translateForLanguage(preferredLanguage)).pipe(
        Effect.catch((error) =>
          Effect.logError(`[MARKDOWN]: translation snapshot unavailable for "${preferredLanguage}"`, error).pipe(Effect.as(translateSource))
        )
      );

const documentName = (request: Request) =>
  pipe(
    decodeUrlOption(request.url),
    Option.map(({ pathname }) => pathname),
    Option.getOrElse(() => request.url)
  );

// Handles language resolution, translation snapshot loading, rendering, and failure recovery
const documentResponse = (render: DocumentBody) =>
  Effect.fnUntraced(function* (request: Request) {
    const langOverride = parseLangParam(request.url);
    const preferredLanguage = requestPreferredLanguage(langOverride);
    const translate = yield* translateFor(preferredLanguage);

    const response = yield* render(request, { preferredLanguage, translate }).pipe(
      recoverDataFailure(
        () => `[${documentName(request)}]`,
        () => mdUnavailableResponse(unavailableMarkdownBody(translate), preferredLanguage)
      )
    );

    return Option.isSome(langOverride) ? pinCacheVariant(response) : response;
  });

const respond = (context: LocalizedMdInput, twin: MarkdownTwin, canonical: string, markdownPath: string) =>
  mdResponse({
    body: twinDocument(twin),
    preferredLanguage: context.preferredLanguage,
    canonical,
    markdownPath,
  });

const pageTwinDocument = <Data>(twin: PageTwin<Data>, datasets: DatasetsService) =>
  documentResponse(
    Effect.fnUntraced(function* (_request: Request, context: LocalizedMdInput) {
      const data = yield* twin.resolveData(datasets, context.preferredLanguage);
      return respond(context, twin.render(data, context), twin.canonical, twin.mdHref);
    })
  );

const notFoundTwin = (slug: Option.Option<string>, context: LocalizedMdInput) =>
  mdNotFoundResponse(twinDocument(buildNotFoundMd({ slug, ...context })), context.preferredLanguage, Option.map(slug, experienceMarkdownPath));

const experienceTwin = (experienceList: LocalizedAccessor<ExperienceList>) =>
  documentResponse(
    Effect.fnUntraced(function* (request: Request, context: LocalizedMdInput) {
      const slug = slugFromMdPathname(request.url);
      if (Option.isNone(slug)) {
        return notFoundTwin(Option.none(), context);
      }

      const slugValue = slug.value;
      const list = yield* experienceList(context.preferredLanguage);
      const found = experienceFromList(list, slugValue);

      if (Option.isNone(found)) {
        yield* Effect.logDebug(`[SLUG.MD]: no experience for slug "${slugValue}", emitting markdown 404`);
        return notFoundTwin(Option.some(slugValue), context);
      }

      const experience = found.value;
      const seo = experienceSeo({ experience, preferredLanguage: context.preferredLanguage });

      return respond(context, buildExperienceMd({ seo, translate: context.translate }), seo.canonical, seo.markdownPath);
    })
  );

const discoveryDocument = (index: { readonly name: string; readonly url: string }, content: Effect.Effect<string, RequiredDataError>) => (_request: Request) =>
  content.pipe(
    Effect.map((body) => txtResponse(body, index.url)),
    recoverDataFailure(
      () => `[${index.name.toUpperCase()}]`,
      () => txtUnavailableResponse(unavailableIndexBody(index.name))
    )
  );

export class Markdown extends Context.Service<Markdown>()("Markdown", {
  make: Effect.gen(function* () {
    const datasets = yield* Datasets;

    return {
      home: pageTwinDocument(HOME_TWIN, datasets),
      education: pageTwinDocument(EDUCATION_TWIN, datasets),
      contact: pageTwinDocument(CONTACT_TWIN, datasets),
      experience: experienceTwin(datasets.experienceList),
      siteIndex: discoveryDocument(LLMS_TXT_INDEX, Effect.map(datasets.experienceList(DEFAULT_LANGUAGE), buildLlmsTxt)),
      siteIndexFull: discoveryDocument(
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
      ),
    } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(Datasets.layer));
}
