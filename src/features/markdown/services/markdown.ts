// Markdown service providing finished pipelines for twins and AI discovery indexes.

// services, features, and other libraries
import { Context, Effect, Layer, Option } from "effect";
import { Datasets } from "@/features/data/services/datasets";
import { requestPreferredLanguage } from "@/features/data/services/request-language";
import { recoverDataFailure } from "@/features/data/domain/required";
import { experienceFromList } from "@/features/experience/domain/helpers";
import { DEFAULT_LANGUAGE } from "@/features/meta/domain/constants";
import { experienceMarkdownPath } from "@/features/meta/domain/urls";
import { experienceSeo } from "@/features/meta/domain/experience-seo";
import { LLMS_FULL_TXT_INDEX, LLMS_TXT_INDEX } from "@/features/meta/domain/link-tags";
import { txtResponse, txtUnavailableResponse } from "@/features/meta/services/responses";
import { mdNotFoundResponse, mdResponse, mdUnavailableResponse, pinCacheVariant } from "./responses";

// domain
import { buildExperienceMd, buildNotFoundMd, unavailableMarkdownBody, translateSource } from "../domain/twins";
import { CONTACT_TWIN, EDUCATION_TWIN, HOME_TWIN } from "../domain/catalogue";
import { buildLlmsFullTxt, buildLlmsTxt, unavailableIndexBody } from "../domain/indexes";
import { parseLangParam, slugFromMdPathname } from "../domain/requests";
import { translateForLanguage } from "@/lib/gt-translations";
import { resolveContactTwinData, resolveEducationTwinData, resolveHomeTwinData } from "./twin-data";
import { twinDocument } from "../domain/format";

// types
import type { LocalizedMdInput, PageTwin } from "../domain/models";
import type { MarkdownTwin } from "../domain/format";
import type { DatasetsService, LocalizedAccessor } from "@/features/data/services/datasets";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { RequiredDataError } from "@/features/data/domain/required";
import type { PreferredLanguage } from "@/domain/models";
import type { TwinDataResolver } from "./twin-data";

// A document pipeline that renders a body off the request context; its data requirement is the
// one every twin declares.
type DocumentBody = (request: Request, context: LocalizedMdInput) => Effect.Effect<Response, RequiredDataError>;

// A finished document: total, because every pipeline that can fail has already recovered into its
// own fallback response.
type DocumentResponse = (request: Request) => Effect.Effect<Response, never>;

const translateFor = (preferredLanguage: PreferredLanguage) =>
  preferredLanguage === DEFAULT_LANGUAGE
    ? Effect.succeed(translateSource)
    : Effect.tryPromise(() => translateForLanguage(preferredLanguage)).pipe(
        Effect.catch((error) =>
          Effect.logError(`[MARKDOWN]: translation snapshot unavailable for "${preferredLanguage}"`, error).pipe(Effect.as(translateSource))
        )
      );

const documentResponse = (render: DocumentBody): DocumentResponse =>
  Effect.fnUntraced(function* (request: Request) {
    const langOverride = parseLangParam(request.url);
    const preferredLanguage = requestPreferredLanguage(langOverride);
    const translate = yield* translateFor(preferredLanguage);

    const response = yield* render(request, { preferredLanguage, translate }).pipe(
      recoverDataFailure("[MARKDOWN]", () => mdUnavailableResponse(unavailableMarkdownBody(translate), preferredLanguage))
    );

    return Option.isSome(langOverride) ? pinCacheVariant(response) : response;
  });

// Builds a markdown HTTP response with canonical and twin route headers. The canonical is the one
// the document's frontmatter also publishes, so the envelope and the body cite the same address.
const respond = (context: LocalizedMdInput, twin: MarkdownTwin, canonical: string, markdownPath: string) =>
  mdResponse({
    body: twinDocument(twin),
    preferredLanguage: context.preferredLanguage,
    canonical,
    markdownPath,
  });

// Full pipeline for a static page twin, resolving the bundle its render declares.
const pageTwinDocument = <Data>(twin: PageTwin<Data>, resolveData: TwinDataResolver<Data>, datasets: DatasetsService): DocumentResponse =>
  documentResponse(
    Effect.fnUntraced(function* (_request: Request, context: LocalizedMdInput) {
      const data = yield* resolveData(datasets, context.preferredLanguage);
      return respond(context, twin.render(data, context), twin.canonical, twin.mdHref);
    })
  );

// Shared 404 response for unparseable or unknown slug requests.
const notFoundTwin = (slug: Option.Option<string>, context: LocalizedMdInput) =>
  mdNotFoundResponse(
    twinDocument(buildNotFoundMd({ slug, ...context })),
    context.preferredLanguage,
    Option.map(slug, experienceMarkdownPath)
  );

// Detail twin resolving the slug against the localized experience list.
const experienceTwin = (experienceList: LocalizedAccessor<ExperienceList>): DocumentResponse =>
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
      // One published SEO record drives the twin body and the response envelope alike, so the
      // frontmatter canonical and the response's own canonical can never spell two addresses.
      const seo = experienceSeo({ experience, preferredLanguage: context.preferredLanguage });

      return respond(context, buildExperienceMd({ seo, translate: context.translate }), seo.canonical, seo.markdownPath);
    })
  );

// English-only plain-text index pipeline with 503 recovery.
const discoveryDocument =
  (index: { readonly name: string; readonly url: string }, content: Effect.Effect<string, RequiredDataError>): DocumentResponse =>
  (_request: Request) =>
    content.pipe(
      Effect.map((body) => txtResponse(body, index.url)),
      recoverDataFailure(`[${index.name.toUpperCase()}]`, () => txtUnavailableResponse(unavailableIndexBody(index.name)))
    );

export class Markdown extends Context.Service<Markdown>()("Markdown", {
  make: Effect.gen(function* () {
    const datasets = yield* Datasets;

    return {
      home: pageTwinDocument(HOME_TWIN, resolveHomeTwinData, datasets),
      education: pageTwinDocument(EDUCATION_TWIN, resolveEducationTwinData, datasets),
      contact: pageTwinDocument(CONTACT_TWIN, resolveContactTwinData, datasets),
      experience: experienceTwin(datasets.experienceList),
      // AI discovery indexes describe fixed English documents resolved per request.
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
  // Layer resolves dataset dependencies internally so endpoints remain requirement-free.
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(Datasets.layer));
}
