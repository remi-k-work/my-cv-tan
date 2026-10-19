// services, features, and other libraries
import { Effect } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { Markdown } from "./markdown";

// Wires a Markdown service method into a TanStack server handler: pick selects a service
// method, and request-free discovery indexes wrap their plain Effect in a () => thunk. The
// service owns the whole pipeline (language negotiation, rendering, headers), so each
// handler stays a pure bridge between the router and the Effect runtime
const serviceHandler =
  (pick: (markdown: Markdown["Service"]) => (request: Request) => Effect.Effect<Response>) =>
  ({ request }: { request: Request }) =>
    RuntimeServer.runPromise(Effect.flatMap(Markdown, (markdown) => pick(markdown)(request)));

// Named endpoints: routes wire a plain identifier and the full AI-facing surface is listed in one place
export const homeHandler = serviceHandler(({ home }) => home);
export const educationHandler = serviceHandler(({ education }) => education);
export const contactHandler = serviceHandler(({ contact }) => contact);
export const experienceHandler = serviceHandler(({ experience }) => experience);

export const llmsTxtHandler = serviceHandler(
  ({ siteIndex }) =>
    () =>
      siteIndex
);
export const llmsFullTxtHandler = serviceHandler(
  ({ siteIndexFull }) =>
    () =>
      siteIndexFull
);
