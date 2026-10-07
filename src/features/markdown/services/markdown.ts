// services, features, and other libraries
import { Context, Effect, Layer, Option } from "effect";
import { requireData } from "@/features/data/domain";
import { Data } from "@/features/data/services/data";
import { Lang } from "@/features/data/services/lang";
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
import type { PreferredLanguage } from "@/domain";

// One home for every AI-facing document pipeline (GEO): language resolution, data
// fetch, Markdown rendering and Response construction. Routes only wire requests.
export class Markdown extends Context.Service<Markdown>()("Markdown", {
  make: Effect.gen(function* () {
    const data = yield* Data;
    const { resolve } = yield* Lang;

    // ?lang= override wins over cookie / Accept-Language resolution
    const language = Effect.fnUntraced(function* (requestUrl: string) {
      const override = yield* parseLangParam(requestUrl);
      if (Option.isSome(override)) return override.value;
      return yield* resolve(Option.none());
    });

    // Fetch + require pairs: every twin renders from the stable (non-random) content bundle in the requested language
    const stablePageTitles = Effect.fnUntraced(function* (preferredLanguage: PreferredLanguage) {
      return yield* requireData(yield* data.stablePageTitles(Option.some(preferredLanguage), Option.none()), "page titles");
    });
    const localizedContent = Effect.fnUntraced(function* (preferredLanguage: PreferredLanguage) {
      return yield* requireData(yield* data.localizedContent(Option.some(preferredLanguage), Option.none()), "localized content");
    });
    const experienceList = Effect.fnUntraced(function* (preferredLanguage: PreferredLanguage) {
      return yield* requireData(yield* data.experienceList(Option.some(preferredLanguage), Option.none()), "experience list");
    });
    const educationList = Effect.fnUntraced(function* (preferredLanguage: PreferredLanguage) {
      return yield* requireData(yield* data.educationList(Option.some(preferredLanguage), Option.none()), "education list");
    });

    const home = Effect.fn("home")(function* (request: Request) {
      const preferredLanguage = yield* language(request.url);
      return yield* markdownDataResponse(
        preferredLanguage,
        Effect.gen(function* () {
          const [pageTitles, content, experiences] = yield* Effect.all(
            [stablePageTitles(preferredLanguage), localizedContent(preferredLanguage), experienceList(preferredLanguage)],
            { concurrency: "unbounded" }
          );
          return mdResponse(
            buildHomeMd({ pageTitles, localizedContent: content, experienceList: experiences, preferredLanguage }),
            preferredLanguage,
            absoluteUrl("/")
          );
        })
      );
    });

    const education = Effect.fn("education")(function* (request: Request) {
      const preferredLanguage = yield* language(request.url);
      return yield* markdownDataResponse(
        preferredLanguage,
        Effect.gen(function* () {
          const [pageTitles, schools] = yield* Effect.all([stablePageTitles(preferredLanguage), educationList(preferredLanguage)], {
            concurrency: "unbounded",
          });
          return mdResponse(buildEducationMd({ pageTitles, educationList: schools, preferredLanguage }), preferredLanguage, absoluteUrl("/education"));
        })
      );
    });

    const contact = Effect.fn("contact")(function* (request: Request) {
      const preferredLanguage = yield* language(request.url);
      return yield* markdownDataResponse(
        preferredLanguage,
        Effect.gen(function* () {
          const pageTitles = yield* stablePageTitles(preferredLanguage);
          return mdResponse(buildContactMd({ pageTitles, preferredLanguage }), preferredLanguage, absoluteUrl("/contact"));
        })
      );
    });

    const experience = Effect.fn("experience")(function* (request: Request) {
      const preferredLanguage = yield* language(request.url);
      const slug = yield* slugFromMdPathname(request.url);

      // Unparseable slug: a clean Markdown 404 instead of a 500 HTML error page
      if (Option.isNone(slug)) return mdNotFoundResponse(buildNotFoundMd("unknown", preferredLanguage), preferredLanguage);

      return yield* markdownDataResponse(
        preferredLanguage,
        Effect.gen(function* () {
          const maybeExperience = experienceFromList(yield* experienceList(preferredLanguage), slug.value);

          if (Option.isNone(maybeExperience)) {
            yield* Effect.logError(`[SLUG.MD]: no experience for slug "${slug.value}", emitting markdown 404`);
            return mdNotFoundResponse(buildNotFoundMd(slug.value, preferredLanguage), preferredLanguage);
          }

          return mdResponse(buildExperienceMd(maybeExperience.value, preferredLanguage), preferredLanguage, absoluteUrl(experiencePath(slug.value)));
        })
      );
    });

    // Site index for AI systems (GEO); English only, so no language negotiation
    const siteIndex = Effect.fn("siteIndex")(function* () {
      return yield* textDataResponse(
        Effect.gen(function* () {
          return txtResponse(buildLlmsTxt(yield* experienceList("en")));
        })
      );
    });

    return { home, education, contact, experience, siteIndex } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide([Data.layer, Lang.layer]));
}
