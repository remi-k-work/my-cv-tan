// tanstack
import { removeResponseHeader } from "@tanstack/react-start/server";

// services, features, and other libraries
import { Context, Effect, Layer, Option } from "effect";
import { translateForLanguage } from "@/lib/gt-translations";
import { RequiredDataError, requireDataFrom } from "@/features/data/domain/required";
import { requestPreferredLanguage } from "@/features/data/domain/helpers";
import { Data } from "@/features/data/services/data";
import { absoluteUrl, experienceMarkdownPath, experiencePath } from "@/features/meta/domain/url";
import { discoveryTxtResponse } from "@/features/meta/domain/response";
import { buildContactMd, buildEducationMd, buildHomeMd } from "@/features/markdown/domain/pages";
import { buildExperienceMd, buildNotFoundMd, experienceFromList } from "@/features/markdown/domain/experience";
import { buildLlmsFullTxt, buildLlmsTxt } from "@/features/markdown/domain/site-index";
import { markdownDataResponse, mdNotFoundResponse, mdResponse, textDataResponse, unavailableIndexBody } from "@/features/markdown/domain/response";
import { parseLangParam, slugFromMdPathname } from "@/features/markdown/domain/request";
import { translateSource } from "@/features/markdown/domain/helpers";

// types
import type { PageTitles, PreferredLanguage, Translate } from "@/domain/models";

// constants
import { CONTACT_MD_HREF, DEFAULT_LANGUAGE, EDUCATION_MD_HREF, HOME_MD_HREF } from "@/features/meta/domain/constants";

// An explicit ?lang= pins the cache variant: the response no longer depends on the locale
// cookie, so drop Vary and the GT set-cookie to keep the response shared-cacheable
const pinCacheVariant = (response: Response) => {
  response.headers.delete("Vary");
  removeResponseHeader("set-cookie");
  return response;
};

// One home for every AI-facing document pipeline (GEO): language resolution, data
// fetch, Markdown rendering and Response construction. Routes only wire named handlers
export class Markdown extends Context.Service<Markdown>()("Markdown", {
  make: Effect.gen(function* () {
    const data = yield* Data;

    // Dataset shortcuts used by every twin: fetch + require in the requested language
    const pageTitles = (lang: PreferredLanguage) => requireDataFrom(data.stablePageTitles(Option.some(lang)), "page titles");
    const experiences = (lang: PreferredLanguage) => requireDataFrom(data.experienceList(Option.some(lang)), "experience list");
    const schools = (lang: PreferredLanguage) => requireDataFrom(data.educationList(Option.some(lang)), "education list");

    // A failed dictionary load must not 500 a machine-readable endpoint: log it and render
    // source-language copy, the same fallback the dictionary itself applies per missing key
    const translateFor = Effect.fnUntraced(function* (lang: PreferredLanguage): Effect.fn.Return<Translate> {
      return yield* Effect.tryPromise(() => translateForLanguage(lang)).pipe(
        Effect.catch((error) => Effect.logError(`[MARKDOWN]: translation snapshot unavailable for "${lang}"`, error).pipe(Effect.as(translateSource)))
      );
    });

    // Shared document pipeline: language negotiation, translation recovery and explicit-variant
    // cache policy live here so each twin below stays a thin fetch-and-render step
    const document = (render: (request: Request, lang: PreferredLanguage, translate: Translate) => Effect.Effect<Response, RequiredDataError>) =>
      Effect.fnUntraced(function* (request: Request) {
        // ?lang= override wins over the GT locale resolved for this request
        const langOverride = parseLangParam(request.url);
        const lang = requestPreferredLanguage(langOverride);
        const translate = yield* translateFor(lang);
        const response = yield* markdownDataResponse(lang, translate, render(request, lang, translate));
        return Option.isSome(langOverride) ? pinCacheVariant(response) : response;
      });

    // Home and education share one shape: page titles plus the list the page renders,
    // fetched concurrently with bounded concurrency to minimize rendering latency
    const staticDocument = <List>(
      path: string,
      markdownPath: string,
      fetchList: (lang: PreferredLanguage) => Effect.Effect<List, RequiredDataError>,
      build: (titles: PageTitles, list: List, lang: PreferredLanguage, translate: Translate) => string
    ) =>
      document((_request, lang, translate) =>
        Effect.map(Effect.all([pageTitles(lang), fetchList(lang)], { concurrency: 2 }), ([titles, list]) =>
          mdResponse(build(titles, list, lang, translate), lang, absoluteUrl(path), absoluteUrl(markdownPath))
        )
      );

    const home = staticDocument("/", HOME_MD_HREF, experiences, (titles, experienceList, lang, translate) =>
      buildHomeMd({ pageTitles: titles, experienceList, preferredLanguage: lang, translate })
    );

    const education = staticDocument("/education", EDUCATION_MD_HREF, schools, (titles, educationList, lang, translate) =>
      buildEducationMd({ pageTitles: titles, educationList, preferredLanguage: lang, translate })
    );

    // Contact renders from titles alone: no list to fetch
    const contact = document((_request, lang, translate) =>
      Effect.map(pageTitles(lang), (titles) =>
        mdResponse(buildContactMd({ pageTitles: titles, preferredLanguage: lang, translate }), lang, absoluteUrl("/contact"), absoluteUrl(CONTACT_MD_HREF))
      )
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

        return mdResponse(
          buildExperienceMd({ experience: found.value, preferredLanguage: lang, translate }),
          lang,
          absoluteUrl(experiencePath(slug.value)),
          absoluteUrl(experienceMarkdownPath(slug.value))
        );
      })
    );

    // English-only discovery documents (llms.txt, llms-full.txt): no language negotiation, so a
    // plain wrapper over textDataResponse; the content fetch stays inside the recovered effect
    const discoveryDocument = (logPrefix: string, name: string, content: Effect.Effect<string, RequiredDataError>) =>
      textDataResponse(logPrefix, unavailableIndexBody(name), Effect.map(content, discoveryTxtResponse));

    // Site index for AI systems (GEO); Effects are lazy, so these are plain values
    const siteIndex = discoveryDocument("[LLMS.TXT]", "llms.txt", Effect.map(experiences(DEFAULT_LANGUAGE), buildLlmsTxt));

    // Full-content companion (llms-full.txt): every twin in one request, fetching datasets concurrently
    const siteIndexFull = discoveryDocument(
      "[LLMS-FULL.TXT]",
      "llms-full.txt",
      Effect.gen(function* () {
        const [titles, experienceList, educationList] = yield* Effect.all(
          [pageTitles(DEFAULT_LANGUAGE), experiences(DEFAULT_LANGUAGE), schools(DEFAULT_LANGUAGE)],
          { concurrency: "unbounded" }
        );
        return buildLlmsFullTxt({ pageTitles: titles, experienceList, educationList });
      })
    );

    return { home, education, contact, experience, siteIndex, siteIndexFull } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(Data.layer));
}
