// services, features, and other libraries
import { Effect } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { Markdown } from "./markdown";

// Wires one Markdown service method into a TanStack server handler
const markdownHandler =
  (pick: (markdown: Markdown["Service"]) => (request: Request) => Effect.Effect<Response>) =>
  ({ request }: { request: Request }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        return yield* pick(yield* Markdown)(request);
      })
    );

// Named endpoints: routes wire a plain identifier and the full AI-facing surface is listed in one place
export const homeHandler = markdownHandler(({ home }) => home);
export const educationHandler = markdownHandler(({ education }) => education);
export const contactHandler = markdownHandler(({ contact }) => contact);
export const experienceHandler = markdownHandler(({ experience }) => experience);
export const llmsTxtHandler = markdownHandler(({ siteIndex }) => siteIndex);
