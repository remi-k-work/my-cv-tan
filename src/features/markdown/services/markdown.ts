// Markdown service providing finished pipelines for twins and AI discovery indexes.

// services, features, and other libraries
import { Context, Effect, Layer, Option } from "effect";
import { Datasets } from "@/features/meta/services/datasets";
import { absoluteUrl, experienceMarkdownPath, experiencePath } from "@/features/meta/domain/url";
import { discoveryTxtResponse, txtUnavailableResponse } from "@/features/meta/domain/response";
import { mdNotFoundResponse, mdResponse } from "@/features/markdown/domain/response";
import { recoverDataFailure } from "@/features/data/domain/required";
import { experienceFromList } from "@/features/experience/domain/helpers";
import { buildExperienceMd } from "@/features/markdown/domain/experience";
import { buildNotFoundMd } from "@/features/markdown/domain/pages";
import { documentResponse } from "@/features/markdown/domain/twin";
import { slugFromMdPathname } from "@/features/markdown/domain/request";
import { buildLlmsFullTxt, buildLlmsTxt, unavailableIndexBody } from "@/features/markdown/domain/site-index";

// types
import type { LocalizedMdInput } from "@/features/markdown/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { DatasetsService, LocalizedAccessor } from "@/features/meta/services/datasets";
import type { PageTwinSpec } from "@/features/markdown/domain/catalogue";
import type { RequiredDataError } from "@/features/data/domain/required";
import type { MachineDocument } from "@/features/markdown/domain/twin";

// constants
import { DEFAULT_LANGUAGE } from "@/features/meta/domain/constants";
import { LLMS_FULL_TXT_INDEX, LLMS_TXT_INDEX } from "@/features/meta/domain/links";
import { CONTACT_TWIN, EDUCATION_TWIN, HOME_TWIN } from "@/features/markdown/domain/catalogue";

// Builds a markdown HTTP response with canonical and twin route headers.
const respond = (context: LocalizedMdInput, body: string, canonicalPath: string, markdownPath: string) =>
  mdResponse({
    body,
    preferredLanguage: context.preferredLanguage,
    canonical: absoluteUrl(canonicalPath),
    markdownPath,
  });

// Full pipeline for a static page twin resolving page titles and specific datasets.
const pageTwinDocument = <Data>(twin: PageTwinSpec<Data>, datasets: DatasetsService): MachineDocument =>
  documentResponse(
    Effect.fnUntraced(function* (_request: Request, context: LocalizedMdInput) {
      const titles = yield* datasets.pageTitles(context.preferredLanguage);
      const data = yield* twin.resolve(datasets, context.preferredLanguage);
      return respond(context, twin.body(titles, data, context), twin.pagePath, twin.mdHref);
    })
  );

// Shared 404 response for unparseable or unknown slug requests.
const notFoundTwin = (slug: Option.Option<string>, context: LocalizedMdInput) =>
  mdNotFoundResponse(buildNotFoundMd({ slug, ...context }), context.preferredLanguage, Option.map(slug, experienceMarkdownPath));

// Detail twin resolving the slug against the localized experience list.
const experienceTwin = (experienceList: LocalizedAccessor<ExperienceList>): MachineDocument =>
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
      return respond(context, buildExperienceMd({ experience, ...context }), experiencePath(experience.slug), experienceMarkdownPath(experience.slug));
    })
  );

// English-only plain-text index pipeline with 503 recovery.
const discoveryDocument =
  (index: { readonly name: string; readonly url: string }, content: Effect.Effect<string, RequiredDataError>): MachineDocument =>
  (_request: Request) =>
    content.pipe(
      Effect.map((body) => discoveryTxtResponse(body, index.url)),
      recoverDataFailure(`[${index.name.toUpperCase()}]`, () => txtUnavailableResponse(unavailableIndexBody(index.name)))
    );

export class Markdown extends Context.Service<Markdown>()("Markdown", {
  make: Effect.gen(function* () {
    const datasets = yield* Datasets;

    return {
      home: pageTwinDocument(HOME_TWIN, datasets),
      education: pageTwinDocument(EDUCATION_TWIN, datasets),
      contact: pageTwinDocument(CONTACT_TWIN, datasets),
      experience: experienceTwin(datasets.experienceList),
      // AI discovery indexes describe fixed English documents resolved per request.
      siteIndex: discoveryDocument(LLMS_TXT_INDEX, Effect.map(datasets.experienceList(DEFAULT_LANGUAGE), buildLlmsTxt)),
      siteIndexFull: discoveryDocument(
        LLMS_FULL_TXT_INDEX,
        Effect.map(
          Effect.all({
            pageTitles: datasets.pageTitles(DEFAULT_LANGUAGE),
            experienceList: datasets.experienceList(DEFAULT_LANGUAGE),
            educationList: datasets.educationList(DEFAULT_LANGUAGE),
          }),
          buildLlmsFullTxt
        )
      ),
    } as const;
  }),
}) {
  // Layer resolves dataset dependencies internally so endpoints remain requirement-free.
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(Datasets.layer));
}
