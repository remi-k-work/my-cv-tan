// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { Effect, Option } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { Data } from "@/features/data/services/data";
import { Lang } from "@/features/data/services/lang";
import { buildEducationMd, mdResponse, parseLangParam } from "@/features/markdown/domain";

const main = (request: Request) =>
  Effect.gen(function* () {
    const data = yield* Data;
    const { resolve } = yield* Lang;

    const langOverride = yield* parseLangParam(request.url);
    const resolved = yield* resolve(Option.none());
    const preferredLanguage = Option.getOrElse(langOverride, () => resolved);

    const { randomPageTitles, educationList } = yield* Effect.all(
      {
        randomPageTitles: data.randomPageTitles(Option.some(preferredLanguage), Option.none()),
        educationList: data.educationList(Option.some(preferredLanguage), Option.none()),
      },
      { concurrency: "unbounded" }
    );
    if (Option.isNone(educationList)) yield* Effect.logError("[EDUCATION.MD]: educationList decode failed, emitting header only");

    return mdResponse(
      buildEducationMd({
        pageTitles: Option.getOrNull(randomPageTitles),
        educationList: Option.getOrElse(educationList, () => []),
        preferredLanguage,
      }),
      preferredLanguage
    );
  });

export const Route = createFileRoute("/education.md")({
  server: {
    handlers: {
      GET: ({ request }) => RuntimeServer.runPromise(main(request)),
    },
  },
});
