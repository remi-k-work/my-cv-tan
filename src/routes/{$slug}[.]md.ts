// oxlint-disable effecttsgo/async-function

// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { Effect, Option } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { Data } from "@/features/data/services/data";
import { Lang } from "@/features/data/services/lang";
import { buildExperienceMd, buildNotFoundMd, mdNotFoundResponse, mdResponse, parseLangParam, slugFromMdPathname } from "@/features/markdown/domain";

const main = (request: Request) =>
  Effect.gen(function* () {
    const data = yield* Data;
    const { resolve } = yield* Lang;

    const langOverride = parseLangParam(request.url);
    const resolved = yield* resolve(Option.none());
    const lang = Option.getOrElse(langOverride, () => resolved);
    const preferredLanguage = Option.some(lang);

    const slug = slugFromMdPathname(request.url);
    if (Option.isNone(slug)) return mdNotFoundResponse(buildNotFoundMd("unknown", lang), lang);

    const experience = yield* data.experience(slug.value, preferredLanguage, Option.none());
    if (Option.isNone(experience)) {
      yield* Effect.logError(`[SLUG.MD]: no experience for slug "${slug.value}", emitting markdown 404`);
      return mdNotFoundResponse(buildNotFoundMd(slug.value, lang), lang);
    }

    return mdResponse(buildExperienceMd(experience.value, lang), lang);
  });

export const Route = createFileRoute("/{$slug}.md")({
  server: {
    handlers: {
      GET: ({ request }) => RuntimeServer.runPromise(main(request)),
    },
  },
});
