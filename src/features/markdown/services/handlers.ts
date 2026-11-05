// Bridges the Markdown service endpoints to TanStack server route handlers.
// Kept apart from the service module so the dependency stays one-directional:
// the runtime provides the Markdown layer, and only this module needs the runtime.

// services, features, and other libraries
import { Effect } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { Markdown } from "./markdown";

const handler =
  (name: keyof Markdown["Service"]) =>
  ({ request }: { request: Request }) =>
    RuntimeServer.runPromise(Effect.flatMap(Markdown, (markdown) => markdown[name](request)));

// Request-aware markdown twin endpoints.
export const homeHandler = handler("home");
export const educationHandler = handler("education");
export const contactHandler = handler("contact");
export const experienceHandler = handler("experience");

// Request-independent GEO indexes for AI ingestion.
export const llmsTxtHandler = handler("siteIndex");
export const llmsFullTxtHandler = handler("siteIndexFull");
