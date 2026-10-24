// services, features, and other libraries
import { Effect } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { Markdown } from "./markdown";

// Bridges request-aware Effect endpoints to TanStack Start server handler signatures
const routeHandler =
  (pick: (markdown: Markdown["Service"]) => (request: Request) => Effect.Effect<Response>) =>
  ({ request }: { request: Request }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const markdown = yield* Markdown;
        return yield* pick(markdown)(request);
      })
    );

// Bridges request-free static Effect endpoints to TanStack Start server handler signatures
const staticHandler = (pick: (markdown: Markdown["Service"]) => Effect.Effect<Response>) => () =>
  RuntimeServer.runPromise(
    Effect.gen(function* () {
      const markdown = yield* Markdown;
      return yield* pick(markdown);
    })
  );

// Request-aware markdown twin endpoints
export const homeHandler = routeHandler(({ home }) => home);
export const educationHandler = routeHandler(({ education }) => education);
export const contactHandler = routeHandler(({ contact }) => contact);
export const experienceHandler = routeHandler(({ experience }) => experience);

// Request-independent GEO indexes for AI ingestion
export const llmsTxtHandler = staticHandler(({ siteIndex }) => siteIndex);
export const llmsFullTxtHandler = staticHandler(({ siteIndexFull }) => siteIndexFull);
