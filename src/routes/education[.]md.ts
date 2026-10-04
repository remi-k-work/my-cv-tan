// oxlint-disable effecttsgo/async-function

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

    const langOverride = parseLangParam(request.url);
    const resolved = yield* resolve(Option.none());
    const lang = Option.getOrElse(langOverride, () => resolved);
    const preferredLanguage = Option.some(lang);

    const { randomPageTitles, educationList } = yield* Effect.all(
      {
        randomPageTitles: data.randomPageTitles(preferredLanguage, Option.none()),
        educationList: data.educationList(preferredLanguage, Option.none()),
      },
      { concurrency: "unbounded" }
    );
    if (Option.isNone(educationList)) yield* Effect.logError("[EDUCATION.MD]: educationList decode failed, emitting header only");

    return mdResponse(
      buildEducationMd({
        pageTitles: Option.getOrNull(randomPageTitles),
        educationList: Option.getOrElse(educationList, () => []),
        lang,
      }),
      lang
    );
  });

export const Route = createFileRoute("/education.md")({
  server: {
    handlers: {
      GET: ({ request }) => RuntimeServer.runPromise(main(request)),
    },
  },
});
