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

    const langOverride = yield* parseLangParam(request.url);
    const resolved = yield* resolve(Option.none());
    const preferredLanguage = Option.getOrElse(langOverride, () => resolved);

    const randomPageTitles = yield* data.randomPageTitles(Option.some(preferredLanguage), Option.none());

    return mdResponse(buildContactMd({ pageTitles: Option.getOrNull(randomPageTitles), preferredLanguage }), preferredLanguage);
  });

export const Route = createFileRoute("/contact.md")({
  server: {
    handlers: {
      GET: ({ request }) => RuntimeServer.runPromise(main(request)),
    },
  },
});
