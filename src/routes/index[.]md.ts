// oxlint-disable effecttsgo/async-function

// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { Effect, Option } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { Data } from "@/features/data/services/data";
import { Lang } from "@/features/data/services/lang";
import { buildHomeMd, mdResponse, parseLangParam } from "@/features/markdown/domain";

const main = (request: Request) =>
  Effect.gen(function* () {
    const data = yield* Data;
    const { resolve } = yield* Lang;

    const langOverride = parseLangParam(request.url);
    const resolved = yield* resolve(Option.none());
    const lang = Option.getOrElse(langOverride, () => resolved);
    const preferredLanguage = Option.some(lang);

    const { randomPageTitles, localizedContent, experienceList } = yield* Effect.all(
      {
        randomPageTitles: data.randomPageTitles(preferredLanguage, Option.none()),
        localizedContent: data.localizedContent(preferredLanguage, Option.none()),
        experienceList: data.experienceList(preferredLanguage, Option.none()),
      },
      { concurrency: "unbounded" }
    );
    if (Option.isNone(experienceList)) yield* Effect.logError("[INDEX.MD]: experienceList decode failed, emitting header only");

    return mdResponse(
      buildHomeMd({
        pageTitles: Option.getOrNull(randomPageTitles),
        localizedContent: Option.getOrNull(localizedContent),
        experienceList: Option.getOrElse(experienceList, () => []),
        lang,
      }),
      lang
    );
  });

export const Route = createFileRoute("/index.md")({
  server: {
    handlers: {
      GET: ({ request }) => RuntimeServer.runPromise(main(request)),
    },
  },
});
