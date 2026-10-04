// oxlint-disable effecttsgo/async-function

// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { Effect, Option } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { Data } from "@/features/data/services/data";
import { Lang } from "@/features/data/services/lang";
import { buildContactMd, mdResponse, parseLangParam } from "@/features/markdown/domain";

const main = (request: Request) =>
  Effect.gen(function* () {
    const data = yield* Data;
    const { resolve } = yield* Lang;

    const langOverride = parseLangParam(request.url);
    const resolved = yield* resolve(Option.none());
    const lang = Option.getOrElse(langOverride, () => resolved);
    const preferredLanguage = Option.some(lang);

    const randomPageTitles = yield* data.randomPageTitles(preferredLanguage, Option.none());

    return mdResponse(buildContactMd({ pageTitles: Option.getOrNull(randomPageTitles), lang }), lang);
  });

export const Route = createFileRoute("/contact.md")({
  server: {
    handlers: {
      GET: ({ request }) => RuntimeServer.runPromise(main(request)),
    },
  },
});
