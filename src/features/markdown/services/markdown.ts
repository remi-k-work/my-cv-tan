// tanstack
import { removeResponseHeader } from "@tanstack/react-start/server";

// services, features, and other libraries
import { Context, Effect, Layer, Option } from "effect";
import { translateForLanguage } from "@/lib/gt-translations";
import { RequiredDataError, requestPreferredLanguage, requireDataFrom } from "@/features/data/domain";
import { Data } from "@/features/data/services/data";
import { absoluteUrl, experiencePath, txtResponse } from "@/features/meta/domain";
import {
  buildContactMd,
  buildEducationMd,
  buildExperienceMd,
  buildHomeMd,
  buildLlmsFullTxt,
  buildLlmsTxt,
  buildNotFoundMd,
  experienceFromList,
  markdownDataResponse,
  mdNotFoundResponse,
  mdResponse,
  parseLangParam,
  slugFromMdPathname,
  textDataResponse,
  translateSource,
} from "@/features/markdown/domain";

// types
import type { PreferredLanguage, Translate } from "@/domain";

// One home for every AI-facing document pipeline (GEO): language resolution, data
// fetch, Markdown rendering and Response construction. Routes only wire named handlers
export class Markdown extends Context.Service<Markdown>()("Markdown", {
  make: Effect.gen(function* () {
    const data = yield* Data;

    // Dataset shortcuts used by every twin: fetch + require in the requested language
    const pageTitles = (lang: PreferredLanguage) => requireDataFrom(data.stablePageTitles(Option.some(lang)), "page titles");
    const experiences = (lang: PreferredLanguage) => requireDataFrom(data.experienceList(Option.some(lang)), "experience list");
    const schools = (lang: PreferredLanguage) => requireDataFrom(data.educationList(Option.some(lang)), "education list");

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
        const [titles, experienceList] = yield* Effect.all([pageTitles(lang), experiences(lang)], { concurrency: "unbounded" });
        return mdResponse(buildHomeMd({ pageTitles: titles, experienceList, preferredLanguage: lang, translate }), lang, absoluteUrl("/"));
      })
    );

    const education = document((_request, lang, translate) =>
      Effect.gen(function* () {
        const [titles, educationList] = yield* Effect.all([pageTitles(lang), schools(lang)], { concurrency: "unbounded" });
        return mdResponse(buildEducationMd({ pageTitles: titles, educationList, preferredLanguage: lang, translate }), lang, absoluteUrl("/education"));
      })
    );

    const contact = document((_request, lang, translate) =>
      Effect.gen(function* () {
        const titles = yield* pageTitles(lang);
        return mdResponse(buildContactMd({ pageTitles: titles, preferredLanguage: lang, translate }), lang, absoluteUrl("/contact"));
      })
    );

    const experience = document((request, lang, translate) =>
      Effect.gen(function* () {
        const slug = slugFromMdPathname(request.url);

        // Unparseable slug: a clean Markdown 404 instead of an HTML error page
        if (Option.isNone(slug)) return mdNotFoundResponse(buildNotFoundMd({ slug: "unknown", preferredLanguage: lang, translate }), lang);

        const found = experienceFromList(yield* experiences(lang), slug.value);

        if (Option.isNone(found)) {
          yield* Effect.logError(`[SLUG.MD]: no experience for slug "${slug.value}", emitting markdown 404`);
          return mdNotFoundResponse(buildNotFoundMd({ slug: slug.value, preferredLanguage: lang, translate }), lang);
        }

        return mdResponse(buildExperienceMd({ experience: found.value, preferredLanguage: lang, translate }), lang, absoluteUrl(experiencePath(slug.value)));
      })
    );

    // English-only discovery documents (llms.txt, llms-full.txt): no language negotiation, so a
    // plain wrapper over textDataResponse; the content fetch stays inside the recovered effect
    const discoveryDocument = (logPrefix: string, unavailableBody: string, content: Effect.Effect<string, RequiredDataError>) =>
      textDataResponse(logPrefix, unavailableBody, Effect.map(content, txtResponse));

    // One honest 503 body for both AI indexes, naming the document so fetchers know what failed
    const indexUnavailableBody = (name: string) =>
      `${name} is temporarily unavailable because required portfolio content could not be loaded. Please try again shortly.\n`;

    // Site index for AI systems (GEO); Effects are lazy, so these are plain values
    const siteIndex = discoveryDocument("[LLMS.TXT]", indexUnavailableBody("llms.txt"), Effect.map(experiences("en"), buildLlmsTxt));

    // Full-content companion (llms-full.txt): every twin in one request
    const siteIndexFull = discoveryDocument(
      "[LLMS-FULL.TXT]",
      indexUnavailableBody("llms-full.txt"),
      Effect.gen(function* () {
        const [titles, experienceList, educationList] = yield* Effect.all([pageTitles("en"), experiences("en"), schools("en")], { concurrency: "unbounded" });
        return buildLlmsFullTxt({ pageTitles: titles, experienceList, educationList });
      })
    );

    return { home, education, contact, experience, siteIndex, siteIndexFull } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(Data.layer));
}
