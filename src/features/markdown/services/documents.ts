// Pipelines for static page twins, detail twins, and AI discovery indexes.
import { Effect, Option } from "effect";
import { buildExperienceMd } from "@/features/markdown/domain/experience";
import { buildNotFoundMd } from "@/features/markdown/domain/not-found";
import { documentResponse, type MachineDocument } from "@/features/markdown/domain/twin";
import { experienceFromList } from "@/features/experience/domain/helpers";
import { recoverDataFailure, type RequiredDataError } from "@/features/data/domain/required";
import {
  discoveryTxtResponse,
  mdNotFoundResponse,
  mdResponse,
  txtUnavailableResponse,
} from "@/features/meta/domain/response";
import { absoluteUrl, experienceMarkdownPath, experiencePath } from "@/features/meta/domain/url";
import { slugFromMdPathname } from "@/features/markdown/domain/request";
import { unavailableIndexBody } from "@/features/markdown/domain/blocks";

// types
import type { PageTwinSpec } from "@/features/markdown/domain/catalogue";
import type { LocalizedMdInput } from "@/features/markdown/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { DatasetsService, LocalizedAccessor } from "@/features/meta/services/datasets";

// Builds a markdown HTTP response with canonical and twin route headers.
const respond = (
  context: LocalizedMdInput,
  body: string,
  canonicalPath: string,
  markdownPath: string
) =>
  mdResponse({
    body,
    preferredLanguage: context.preferredLanguage,
    canonical: absoluteUrl(canonicalPath),
    markdownPath,
  });

// Full pipeline for a static page twin resolving page titles and specific datasets.
export const pageTwinDocument = <Data>(twin: PageTwinSpec<Data>, datasets: DatasetsService): MachineDocument =>
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
export const experienceTwin = (experienceList: LocalizedAccessor<ExperienceList>): MachineDocument =>
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
export const discoveryDocument = (
  index: { readonly name: string; readonly url: string },
  content: () => Effect.Effect<string, RequiredDataError>
): MachineDocument =>
  (_request: Request) =>
    Effect.suspend(content).pipe(
      Effect.map((body) => discoveryTxtResponse(body, index.url)),
      recoverDataFailure(`[${index.name.toUpperCase()}]`, () => txtUnavailableResponse(unavailableIndexBody(index.name)))
    );
