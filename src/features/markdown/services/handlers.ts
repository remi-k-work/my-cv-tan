// services, features, and other libraries
import { Effect } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { Markdown } from "./markdown";

// Wires one request-taking Markdown service method into a TanStack server handler. The
// service owns the whole request pipeline (language negotiation, rendering, response
// headers), so the handler is a pure bridge between the router and the Effect runtime.
const markdownHandler =
  (pick: (markdown: Markdown["Service"]) => (request: Request) => Effect.Effect<Response>) =>
  ({ request }: { request: Request }) =>
    RuntimeServer.runPromise(Effect.flatMap(Markdown, (markdown) => pick(markdown)(request)));

// Wires a plain-effect member: the request plays no part in the English-only discovery indexes
const markdownEffectHandler = (pick: (markdown: Markdown["Service"]) => Effect.Effect<Response>) => () =>
  RuntimeServer.runPromise(Effect.flatMap(Markdown, pick));

// Named endpoints: routes wire a plain identifier and the full AI-facing surface is listed in one place
export const homeHandler = markdownHandler(({ home }) => home);
export const educationHandler = markdownHandler(({ education }) => education);
export const contactHandler = markdownHandler(({ contact }) => contact);
export const experienceHandler = markdownHandler(({ experience }) => experience);
export const llmsTxtHandler = markdownEffectHandler(({ siteIndex }) => siteIndex);
export const llmsFullTxtHandler = markdownEffectHandler(({ siteIndexFull }) => siteIndexFull);
