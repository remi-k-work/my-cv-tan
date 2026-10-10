// tanstack
import { removeResponseHeader } from "@tanstack/react-start/server";

// services, features, and other libraries
import { Context, Effect, Layer, Option } from "effect";
import { translateForLanguage } from "@/lib/gt-translations";
import { requireData, RequiredDataError, requestPreferredLanguage } from "@/features/data/domain";
import { Data } from "@/features/data/services/data";
import { absoluteUrl, experiencePath } from "@/features/meta/domain";
import {
  buildContactMd,
  buildEducationMd,
  buildExperienceMd,
  buildHomeMd,
  buildLlmsTxt,
  buildNotFoundMd,
  experienceFromList,
  markdownDataResponse,
  mdNotFoundResponse,
  mdResponse,
  parseLangParam,
  slugFromMdPathname,
  textDataResponse,
  txtResponse,
} from "@/features/markdown/domain";

// types
import type { PreferredLanguage, Translate } from "@/domain";

// Fetch + require in one step: every twin renders from the stable content bundle in the requested language
const required = <A>(maybe: Effect.Effect<Option.Option<A>>, dataset: string): Effect.Effect<A, RequiredDataError> =>
  Effect.flatMap(maybe, (option) => requireData(option, dataset));

// Source-language copy: the same fallback the dictionary itself applies per missing key
const translateSource: Translate = (source) => source;

// One home for every AI-facing document pipeline (GEO): language resolution, data
// fetch, Markdown rendering and Response construction. Routes only wire named handlers
export class Markdown extends Context.Service<Markdown>()("Markdown", {
  make: Effect.gen(function* () {
    const data = yield* Data;

    // Shared document pipeline: language negotiation, translation lookup, unavailable-data recovery and
    // explicit-variant cache policy live here so each twin below stays a thin fetch-and-render step
    const document = (render: (request: Request, lang: PreferredLanguage, translate: Translate) => Effect.Effect<Response, RequiredDataError>) =>
      Effect.fnUntraced(function* (request: Request) {
        // ?lang= override wins over the GT locale resolved for this request
        const langOverride = parseLangParam(request.url);
        const lang = requestPreferredLanguage(langOverride);
        // A failed dictionary load must not 500 a machine-readable endpoint; source-language copy still renders
        const translate = yield* Effect.tryPromise(() => translateForLanguage(lang)).pipe(
          Effect.catch((error) => Effect.logError(`[MARKDOWN]: translation snapshot unavailable for "${lang}"`, error).pipe(Effect.as(translateSource)))
        );
        const response = yield* markdownDataResponse(lang, translate, render(request, lang, translate));

        // An explicit ?lang= pins the cache variant: the response no longer depends on
        // the locale cookie, so drop Vary and the GT set-cookie to keep it shared-cacheable
        if (Option.isSome(langOverride)) {
          response.headers.delete("Vary");
          removeResponseHeader("set-cookie");
        }

        return response;
      });

    const home = document((_request, lang, translate) =>
      Effect.gen(function* () {
        const [pageTitles, experiences] = yield* Effect.all(
          [required(data.stablePageTitles(Option.some(lang)), "page titles"), required(data.experienceList(Option.some(lang)), "experience list")],
          { concurrency: "unbounded" }
        );
        return mdResponse(buildHomeMd({ pageTitles, experienceList: experiences, preferredLanguage: lang, translate }), lang, absoluteUrl("/"));
      })
    );

    const education = document((_request, lang, translate) =>
      Effect.gen(function* () {
        const [pageTitles, schools] = yield* Effect.all(
          [required(data.stablePageTitles(Option.some(lang)), "page titles"), required(data.educationList(Option.some(lang)), "education list")],
          { concurrency: "unbounded" }
        );
        return mdResponse(buildEducationMd({ pageTitles, educationList: schools, preferredLanguage: lang, translate }), lang, absoluteUrl("/education"));
      })
    );

    const contact = document((_request, lang, translate) =>
      Effect.gen(function* () {
        const pageTitles = yield* required(data.stablePageTitles(Option.some(lang)), "page titles");
        return mdResponse(buildContactMd({ pageTitles, preferredLanguage: lang, translate }), lang, absoluteUrl("/contact"));
      })
    );

    const experience = document((request, lang, translate) =>
      Effect.gen(function* () {
        const slug = slugFromMdPathname(request.url);

        // Unparseable slug: a clean Markdown 404 instead of an HTML error page
        if (Option.isNone(slug)) return mdNotFoundResponse(buildNotFoundMd({ slug: "unknown", preferredLanguage: lang, translate }), lang);

        const found = experienceFromList(yield* required(data.experienceList(Option.some(lang)), "experience list"), slug.value);

        if (Option.isNone(found)) {
          yield* Effect.logError(`[SLUG.MD]: no experience for slug "${slug.value}", emitting markdown 404`);
          return mdNotFoundResponse(buildNotFoundMd({ slug: slug.value, preferredLanguage: lang, translate }), lang);
        }

        return mdResponse(buildExperienceMd({ experience: found.value, preferredLanguage: lang, translate }), lang, absoluteUrl(experiencePath(slug.value)));
      })
    );

    // Site index for AI systems (GEO); English only, so no language negotiation
    const siteIndex = Effect.fnUntraced(function* () {
      // The fetch must stay inside the recovered effect so a data failure becomes the 503 twin
      return yield* textDataResponse(
        Effect.map(required(data.experienceList(Option.some("en")), "experience list"), (experienceList) => txtResponse(buildLlmsTxt(experienceList)))
      );
    });

    return { home, education, contact, experience, siteIndex } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(Data.layer));
}
