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

    const langOverride = yield* parseLangParam(request.url);
    const resolved = yield* resolve(Option.none());
    const preferredLanguage = Option.getOrElse(langOverride, () => resolved);

    const slug = yield* slugFromMdPathname(request.url);
    if (Option.isNone(slug)) return mdNotFoundResponse(buildNotFoundMd("unknown", preferredLanguage), preferredLanguage);

    const experience = yield* data.experience(slug.value, Option.some(preferredLanguage), Option.none());
    if (Option.isNone(experience)) {
      yield* Effect.logError(`[SLUG.MD]: no experience for slug "${slug.value}", emitting markdown 404`);
      return mdNotFoundResponse(buildNotFoundMd(slug.value, preferredLanguage), preferredLanguage);
    }

    return mdResponse(buildExperienceMd(experience.value, preferredLanguage), preferredLanguage);
  });

export const Route = createFileRoute("/{$slug}.md")({
  server: {
    handlers: {
      GET: ({ request }) => RuntimeServer.runPromise(main(request)),
    },
  },
});
