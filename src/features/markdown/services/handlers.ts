// services, features, and other libraries
import { Effect, Option } from "effect";
import { removeResponseHeader } from "@tanstack/react-start/server";
import { RuntimeServer } from "@/lib/runtime-server";
import { Markdown } from "./markdown";
import { parseLangParam } from "../domain";

// Wires one Markdown service method into a TanStack server handler
const markdownHandler =
  (pick: (markdown: Markdown["Service"]) => (request: Request) => Effect.Effect<Response>) =>
  ({ request }: { request: Request }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const languageOverride = yield* parseLangParam(request.url);
        const response = yield* pick(yield* Markdown)(request);

        if (Option.isSome(languageOverride) && new URL(request.url).pathname.endsWith(".md")) {
          // The explicit URL locale identifies the cache variant and must not overwrite the browser locale
          yield* Effect.sync(() => {
            response.headers.delete("Vary");
            removeResponseHeader("set-cookie");
          });
        }

        return response;
      })
    );

// Named endpoints: routes wire a plain identifier and the full AI-facing surface is listed in one place
export const homeHandler = markdownHandler(({ home }) => home);
export const educationHandler = markdownHandler(({ education }) => education);
export const contactHandler = markdownHandler(({ contact }) => contact);
export const experienceHandler = markdownHandler(({ experience }) => experience);
export const llmsTxtHandler = markdownHandler(({ siteIndex }) => siteIndex);
