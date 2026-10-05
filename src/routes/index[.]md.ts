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

    const langOverride = yield* parseLangParam(request.url);
    const resolved = yield* resolve(Option.none());
    const preferredLanguage = Option.getOrElse(langOverride, () => resolved);

    const { randomPageTitles, localizedContent, experienceList } = yield* Effect.all(
      {
        randomPageTitles: data.randomPageTitles(Option.some(preferredLanguage), Option.none()),
        localizedContent: data.localizedContent(Option.some(preferredLanguage), Option.none()),
        experienceList: data.experienceList(Option.some(preferredLanguage), Option.none()),
      },
      { concurrency: "unbounded" }
    );
    if (Option.isNone(experienceList)) yield* Effect.logError("[INDEX.MD]: experienceList decode failed, emitting header only");

    return mdResponse(
      buildHomeMd({
        pageTitles: Option.getOrNull(randomPageTitles),
        localizedContent: Option.getOrNull(localizedContent),
        experienceList: Option.getOrElse(experienceList, () => []),
        preferredLanguage,
      }),
      preferredLanguage
    );
  });

export const Route = createFileRoute("/index.md")({
  server: {
    handlers: {
      GET: ({ request }) => RuntimeServer.runPromise(main(request)),
    },
  },
});
