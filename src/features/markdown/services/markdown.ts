// services, features, and other libraries
import { Context, Effect, Layer, Option } from "effect";
import { Data } from "@/features/data/services/data";
import { Lang } from "@/features/data/services/lang";
import {
  buildContactMd,
  buildEducationMd,
  buildExperienceMd,
  buildHomeMd,
  buildLlmsTxt,
  buildNotFoundMd,
  mdNotFoundResponse,
  mdResponse,
  parseLangParam,
  slugFromMdPathname,
  txtResponse,
} from "@/features/markdown/domain";

// types
import type { Experience } from "@/features/experience/domain";

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

    const home = Effect.fn("home")(function* (request: Request) {
      const preferredLanguage = yield* language(request.url);
      const { stablePageTitles, localizedContent, experienceList } = yield* Effect.all(
        {
          stablePageTitles: data.stablePageTitles(Option.some(preferredLanguage), Option.none()),
          localizedContent: data.localizedContent(Option.some(preferredLanguage), Option.none()),
          experienceList: data.experienceList(Option.some(preferredLanguage), Option.none()),
        },
        { concurrency: "unbounded" }
      );
      if (Option.isNone(experienceList)) yield* Effect.logError("[INDEX.MD]: experienceList decode failed, emitting header only");

      return mdResponse(
        buildHomeMd({
          pageTitles: Option.getOrNull(stablePageTitles),
          localizedContent: Option.getOrNull(localizedContent),
          experienceList: Option.getOrElse(experienceList, () => []),
          preferredLanguage,
        }),
        preferredLanguage
      );
    });

    const education = Effect.fn("education")(function* (request: Request) {
      const preferredLanguage = yield* language(request.url);
      const { stablePageTitles, educationList } = yield* Effect.all(
        {
          stablePageTitles: data.stablePageTitles(Option.some(preferredLanguage), Option.none()),
          educationList: data.educationList(Option.some(preferredLanguage), Option.none()),
        },
        { concurrency: "unbounded" }
      );
      if (Option.isNone(educationList)) yield* Effect.logError("[EDUCATION.MD]: educationList decode failed, emitting header only");

      return mdResponse(
        buildEducationMd({
          pageTitles: Option.getOrNull(stablePageTitles),
          educationList: Option.getOrElse(educationList, () => []),
          preferredLanguage,
        }),
        preferredLanguage
      );
    });

    const contact = Effect.fn("contact")(function* (request: Request) {
      const preferredLanguage = yield* language(request.url);
      const stablePageTitles = yield* data.stablePageTitles(Option.some(preferredLanguage), Option.none());
      return mdResponse(buildContactMd({ pageTitles: Option.getOrNull(stablePageTitles), preferredLanguage }), preferredLanguage);
    });

    const experience = Effect.fn("experience")(function* (request: Request) {
      const preferredLanguage = yield* language(request.url);
      const slug = yield* slugFromMdPathname(request.url);
      const maybeExperience = yield* Option.match(slug, {
        onNone: () => Effect.succeed(Option.none<Experience>()),
        onSome: (value) => data.experience(value, Option.some(preferredLanguage), Option.none()),
      });
      const missing = Option.getOrElse(slug, () => "unknown");

      if (Option.isNone(maybeExperience)) {
        yield* Effect.logError(`[SLUG.MD]: no experience for slug "${missing}", emitting markdown 404`);
        return mdNotFoundResponse(buildNotFoundMd(missing, preferredLanguage), preferredLanguage);
      }

      return mdResponse(buildExperienceMd(maybeExperience.value, preferredLanguage), preferredLanguage);
    });

    // Site index for AI systems (GEO); English only, so no language negotiation
    const siteIndex = Effect.fn("siteIndex")(function* () {
      const maybeList = yield* data.experienceList(Option.some("en"), Option.none());
      if (Option.isNone(maybeList)) yield* Effect.logError("[LLMS.TXT]: experienceList decode failed, emitting pages only");

      return txtResponse(buildLlmsTxt(Option.getOrElse(maybeList, () => [])));
    });

    return { home, education, contact, experience, siteIndex } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide([Data.layer, Lang.layer]));
}
