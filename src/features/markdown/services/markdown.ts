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
import { experienceFromList } from "@/features/experience/domain/helpers";
import { buildExperienceMd, buildNotFoundMd } from "@/features/markdown/domain/experience";
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
    const translateFor = (lang: PreferredLanguage): Effect.Effect<Translate> =>
      Effect.tryPromise(() => translateForLanguage(lang)).pipe(
        Effect.catch((error) => Effect.logError(`[MARKDOWN]: translation snapshot unavailable for "${lang}"`, error).pipe(Effect.as(translateSource)))
      );

    // Shared document pipeline: handles language negotiation, translation recovery, and CDN cache-pinning
    const document = (render: (request: Request, lang: PreferredLanguage, translate: Translate) => Effect.Effect<Response, RequiredDataError>) =>
      Effect.fnUntraced(function* (request: Request) {
        // ?lang= query parameter overrides request-level Accept-Language/cookie negotiation
        const langOverride = parseLangParam(request.url);
        const lang = requestPreferredLanguage(langOverride);
        const translate = yield* translateFor(lang);
        const response = yield* markdownDataResponse(lang, translate, render(request, lang, translate));
        // Pinned ?lang= query variants drop Vary header and session cookies for shared edge caching
        return Option.isSome(langOverride) ? pinCacheVariant(response) : response;
      });

    // Home and education share one pipeline shape: fetches page titles and collection data together
    // Both lookups read already-decoded in-memory assets, so they resolve synchronously and the
    // default sequential Effect.all avoids forking fibers to run them
    const staticDocument = <List>(
      path: string,
      markdownPath: string,
      fetchList: (lang: PreferredLanguage) => Effect.Effect<List, RequiredDataError>,
      build: (titles: PageTitles, list: List, lang: PreferredLanguage, translate: Translate) => string
    ) =>
      document((_request, lang, translate) =>
        Effect.map(Effect.all([pageTitles(lang), fetchList(lang)]), ([titles, list]) =>
          mdResponse(build(titles, list, lang, translate), lang, absoluteUrl(path), absoluteUrl(markdownPath))
        )
      );

    const home = staticDocument("/", HOME_MD_HREF, experiences, (titles, experienceList, lang, translate) =>
      buildHomeMd({ pageTitles: titles, experienceList, preferredLanguage: lang, translate })
    );

    const education = staticDocument("/education", EDUCATION_MD_HREF, schools, (titles, educationList, lang, translate) =>
      buildEducationMd({ pageTitles: titles, educationList, preferredLanguage: lang, translate })
    );

    // Contact renders from titles alone without supplementary collection fetches
    const contact = document((_request, lang, translate) =>
      Effect.map(pageTitles(lang), (titles) =>
        mdResponse(buildContactMd({ pageTitles: titles, preferredLanguage: lang, translate }), lang, absoluteUrl("/contact"), absoluteUrl(CONTACT_MD_HREF))
      )
    );

    // Experience detail endpoint: resolves slug, retrieves localized item, and renders clean markdown twin or 404
    const experience = document((request, lang, translate) =>
      Effect.gen(function* () {
        const slugOpt = slugFromMdPathname(request.url);

        // Unparseable slug returns an explicit, crawlable Markdown 404 document
        if (Option.isNone(slugOpt)) {
          return mdNotFoundResponse(buildNotFoundMd({ slug: "unknown", preferredLanguage: lang, translate }), lang);
        }

        const slug = slugOpt.value;
        const list = yield* experiences(lang);
        const matched = experienceFromList(list, slug);

        // Missing experience item logs defect and answers with semantic localized Markdown 404
        if (Option.isNone(matched)) {
          yield* Effect.logError(`[SLUG.MD]: no experience for slug "${slug}", emitting markdown 404`);
          return mdNotFoundResponse(buildNotFoundMd({ slug, preferredLanguage: lang, translate }), lang);
        }

        return mdResponse(
          buildExperienceMd({ experience: matched.value, preferredLanguage: lang, translate }),
          lang,
          absoluteUrl(experiencePath(slug)),
          absoluteUrl(experienceMarkdownPath(slug))
        );
      })
    );

    // English-only discovery documents (llms.txt, llms-full.txt): static plain-text endpoints for AI crawlers
    const discoveryDocument = (logPrefix: string, name: string, content: Effect.Effect<string, RequiredDataError>) =>
      textDataResponse(logPrefix, unavailableIndexBody(name), Effect.map(content, discoveryTxtResponse));

    // Structured index for AI crawlers (GEO): provides factual profile and .md twin catalog
    const siteIndex = discoveryDocument("[LLMS.TXT]", "llms.txt", Effect.map(experiences(DEFAULT_LANGUAGE), buildLlmsTxt));

    // Full-content companion (llms-full.txt): concatenates every markdown twin for single-request ingestion
    const siteIndexFull = discoveryDocument(
      "[LLMS-FULL.TXT]",
      "llms-full.txt",
      Effect.gen(function* () {
        // The three datasets are synchronous in-memory lookups, so the plain
        // (sequential) Effect.all runs them without forking fibers
        const [titles, experienceList, educationList] = yield* Effect.all([
          pageTitles(DEFAULT_LANGUAGE),
          experiences(DEFAULT_LANGUAGE),
          schools(DEFAULT_LANGUAGE),
        ]);
        return buildLlmsFullTxt({ pageTitles: titles, experienceList, educationList });
      })
    );

    return { home, education, contact, experience, siteIndex, siteIndexFull } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(Data.layer));
}
