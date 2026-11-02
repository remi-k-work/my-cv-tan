// services, features, and other libraries
import { Effect, pipe } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { Markdown } from "./markdown";

// Bridges one machine-readable document to the TanStack server handler signature. Each document on the
// Markdown service is requirement-free — the layer internalizes the Data dependency — so the only
// requirement left at this boundary is the Markdown service itself, which the shared server runtime
// provides.
//
// Keyed by the document's name on the Markdown service instead of a `pick` closure, so each route
// below is one line naming its document. The key generic is the safety net: naming a document the
// service does not carry is a compile error, not a runtime handler invoking `undefined`.
export const handler = <K extends keyof Markdown["Service"]>(name: K) => ({ request }: { request: Request }) =>
  RuntimeServer.runPromise(pipe(Markdown, Effect.flatMap((markdown) => markdown[name](request))));

// Request-aware markdown twin endpoints.
export const homeHandler = handler("home");
export const educationHandler = handler("education");
export const contactHandler = handler("contact");
export const experienceHandler = handler("experience");

// Request-independent GEO indexes for AI ingestion.
export const llmsTxtHandler = handler("siteIndex");
export const llmsFullTxtHandler = handler("siteIndexFull");
