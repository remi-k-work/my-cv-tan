// --- Machine-readable document pipelines ---
//
// One module for the three shapes every AI-facing document takes: a localized page twin, a localized
// detail twin, and a static English-only index. The service catalogue (markdown.ts) is a table of
// these finished pipelines and nothing else.
//
// Untraced: the twin pipeline (documentResponse in twin.ts) already owns the span that matters.

// services, features, and other libraries
import { Effect, Option } from "effect";
import { buildExperienceMd } from "@/features/markdown/domain/experience";
import { buildNotFoundMd } from "@/features/markdown/domain/not-found";
import { documentResponse, type MachineDocument } from "@/features/markdown/domain/twin";
import { experienceFromList } from "@/features/experience/domain/helpers";
import { recoverDataFailure } from "@/features/data/domain/required";
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
import type { PageTwinSpec, TwinData } from "@/features/markdown/domain/catalogue";
import type { LocalizedMdInput } from "@/features/markdown/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { DatasetsService, LocalizedAccessor } from "@/features/meta/services/datasets";
import type { RequiredDataError } from "@/features/data/domain/required";

// Builds the shared mdResponse for a rendered twin body. Canonical and twin route are made absolute
// here, so call sites pass site-relative paths and never duplicate the absoluteUrl call.
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

// A page twin's full pipeline: resolve the stable page copy the HTML head reads the same way,
// resolve exactly the datasets the declaration resolves, render the body, and assemble the response.
//
// Generic over the twin's dataset set rather than widening it to the full record, so a route
// receives exactly the values its declaration resolves — nothing is fabricated for a dataset a
// twin does not render.
export const pageTwinDocument = <Data>(twin: PageTwinSpec<Data>, datasets: DatasetsService): MachineDocument =>
  documentResponse(
    Effect.fnUntraced(function* (_request: Request, context: LocalizedMdInput) {
      const titles = yield* datasets.pageTitles(context.preferredLanguage);
      const data = yield* twin.resolve(datasets, context.preferredLanguage);
      return respond(context, twin.body(titles, data, context), twin.pagePath, twin.mdHref);
    })
  );

// The one 404 twin every miss answers with. An unparseable address and an unknown slug differ only
// in whether the address had a name to quote, and the Option carries exactly that — so the two
// branches cannot drift apart on which facts a dead-slug document declares.
const notFoundTwin = (slug: Option.Option<string>, context: LocalizedMdInput) =>
  mdNotFoundResponse(buildNotFoundMd({ slug, ...context }), context.preferredLanguage, Option.map(slug, experienceMarkdownPath));

// Detail twin: resolve the slug, retrieve the localized item, and render the clean Markdown document
// or an honest, crawlable 404 twin.
//
// Every branch is expressed as data (Option.match) rather than a boolean branch: the presence or
// absence of a slug and of a matching experience are both handled as values, so no branch can be
// forgotten and no slug can ever be quoted twice.
export const experienceTwin = (experienceList: LocalizedAccessor<ExperienceList>): MachineDocument =>
  documentResponse(
    Effect.fnUntraced(function* (request: Request, context: LocalizedMdInput) {
      const slug = slugFromMdPathname(request.url);

      // A missing or undecodable slug is an honest 404, not a defect. Both miss branches converge on
      // the same notFoundTwin so neither can forget a header the other sets — the Option carries that
      // requirement rather than two call sites.
      return yield* Option.match(slug, {
        onNone: () => Effect.succeed(notFoundTwin(Option.none(), context)),
        onSome: (slugValue) =>
          Effect.gen(function* () {
            const list = yield* experienceList(context.preferredLanguage);
            const found = experienceFromList(list, slugValue);

            // A miss is a content answer, not a defect: answer with a semantic localized 404 twin rather
            // than failing the whole document. The miss branch logs (debug, not warning — guessed-slug
            // crawls would otherwise drown out real failures) before responding.
            return yield* Option.match(found, {
              onNone: () =>
                Effect.logDebug(`[SLUG.MD]: no experience for slug "${slugValue}", emitting markdown 404`).pipe(
                  Effect.map(() => notFoundTwin(Option.some(slugValue), context))
                ),
              // The data slug, not the requested one, drives every URL: the loader matches on it, so this
              // is the value canonical, social and JSON-LD already publish.
              onSome: (experience) =>
                Effect.succeed(
                  respond(context, buildExperienceMd({ experience, ...context }), experiencePath(experience.slug), experienceMarkdownPath(experience.slug))
                ),
            });
          }),
      });
    })
  );

// The AI indexes are English-only static plain-text documents: no language negotiation and no
// translate injection, only the shared 503 recovery that names the document which failed.
//
// Returns a `MachineDocument` like the twins do — the request is intentionally ignored — so every
// entry in the catalogue has one shape and one way to invoke it.
//
// `content` is a thunk: the document effect is built per request rather than once at service
// construction, so a later service method reading request-scoped state cannot be silently replayed
// across requests.
//
// `name` is the document's public name (llms.txt), which doubles as the log label, so a call site
// names the failing document once instead of twice and the two can never disagree.
export const discoveryDocument = (name: string, content: () => Effect.Effect<string, RequiredDataError>, contentLocation?: string): MachineDocument =>
  (_request: Request) =>
    Effect.suspend(content).pipe(
      Effect.map((body) => discoveryTxtResponse(body, contentLocation)),
      // A transient failure becomes the same non-cacheable noindex 503 the twins answer with, so an
      // outage never leaves a crawler a truncated index to ingest.
      recoverDataFailure(`[${name.toUpperCase()}]`, () => txtUnavailableResponse(unavailableIndexBody(name)))
    );
