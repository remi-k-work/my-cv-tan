// Markdown service providing finished pipelines for twins and AI discovery indexes.

// services, features, and other libraries
import { Context, Effect, Layer, Option } from "effect";
import { removeResponseHeader } from "@tanstack/react-start/server";
import { RuntimeServer } from "@/lib/runtime-server";
import { Datasets } from "@/features/data/services/datasets";
import { requestPreferredLanguage } from "@/features/data/domain/helpers";
import { recoverDataFailure } from "@/features/data/domain/required";
import { experienceFromList } from "@/features/experience/domain/helpers";
import { DEFAULT_LANGUAGE } from "@/features/meta/domain/constants";
import {
  absoluteUrl,
  experienceMarkdownPath,
  experiencePath,
  LLMS_FULL_TXT_INDEX,
  LLMS_TXT_INDEX,
  parseLangParam,
  slugFromMdPathname,
} from "@/features/meta/domain/links";
import { discoveryTxtResponse, txtUnavailableResponse, mdNotFoundResponse, mdResponse, mdUnavailableResponse } from "@/features/meta/services/http";

// domain
import {
  buildExperienceMd,
  buildNotFoundMd,
  unavailableMarkdownBody,
  CONTACT_TWIN,
  EDUCATION_TWIN,
  HOME_TWIN,
  translateSource,
} from "../domain/twins";
import { buildLlmsFullTxt, buildLlmsTxt, unavailableIndexBody } from "../domain/indexes";
import { translateForLanguage } from "@/lib/gt-translations";

// types
import type { LocalizedMdInput, PageTwin } from "../domain/models";
import type { DatasetsService, LocalizedAccessor } from "@/features/data/services/datasets";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { RequiredDataError } from "@/features/data/domain/required";
import type { PreferredLanguage } from "@/domain/models";

type MachineDocumentBody = (request: Request, context: LocalizedMdInput) => Effect.Effect<Response, RequiredDataError>;
type MachineDocument = (request: Request) => Effect.Effect<Response, never>;

// Explicit language pins are safe to cache as a single variant, independent of visitor cookies.
const pinCacheVariant = (response: Response): Response => {
  const headers = new Headers(response.headers);
  headers.delete("vary");
  removeResponseHeader("set-cookie");

  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};

const translateFor = (preferredLanguage: PreferredLanguage) =>
  Effect.tryPromise(() => translateForLanguage(preferredLanguage)).pipe(
    Effect.catch((error) =>
      Effect.logError(`[MARKDOWN]: translation snapshot unavailable for "${preferredLanguage}"`, error).pipe(
        Effect.as(translateSource)
      )
    )
  );

const documentResponse = (render: MachineDocumentBody): MachineDocument =>
  Effect.fnUntraced(function* (request: Request) {
    const langOverride = parseLangParam(request.url);
    const preferredLanguage = requestPreferredLanguage(langOverride);
    const translate = yield* translateFor(preferredLanguage);

    const response = yield* render(request, { preferredLanguage, translate }).pipe(
      recoverDataFailure("[MARKDOWN]", () => mdUnavailableResponse(unavailableMarkdownBody(translate), preferredLanguage))
    );

    return Option.isSome(langOverride) ? pinCacheVariant(response) : response;
  });

// Builds a markdown HTTP response with canonical and twin route headers.
const respond = (context: LocalizedMdInput, body: string, canonicalPath: string, markdownPath: string) =>
  mdResponse({
    body,
    preferredLanguage: context.preferredLanguage,
    canonical: absoluteUrl(canonicalPath),
    markdownPath,
  });

// Full pipeline for a static page twin resolving page titles and specific datasets.
const pageTwinDocument = <Data>(twin: PageTwin<Data>, datasets: DatasetsService): MachineDocument =>
  documentResponse(
    Effect.fnUntraced(function* (_request: Request, context: LocalizedMdInput) {
      const { pageTitles, data } = yield* Effect.all(
        {
          pageTitles: datasets.pageTitles(context.preferredLanguage),
          data: twin.resolve(datasets, context.preferredLanguage),
        },
        { concurrency: "unbounded" }
      );
      return respond(context, twin.render(pageTitles, data, context), twin.pagePath, twin.mdHref);
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
      return respond(
        context,
        buildExperienceMd({ experience, ...context }),
        experiencePath(experience.slug),
        experienceMarkdownPath(experience.slug)
      );
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

// Bridges machine-readable document routes to TanStack server route handlers.
const handler =
  (name: keyof Markdown["Service"]) =>
  ({ request }: { request: Request }) =>
    RuntimeServer.runPromise(Effect.flatMap(Markdown, (markdown) => markdown[name](request)));

// Request-aware markdown twin endpoints.
export const homeHandler = handler("home");
export const educationHandler = handler("education");
export const contactHandler = handler("contact");
export const experienceHandler = handler("experience");

// Request-independent GEO indexes for AI ingestion.
export const llmsTxtHandler = handler("siteIndex");
export const llmsFullTxtHandler = handler("siteIndexFull");
