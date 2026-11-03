// services, features, and other libraries
import { Effect, pipe } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { Markdown } from "./markdown";

// Bridges machine-readable document routes to TanStack server route handlers.
const handler = <K extends keyof Markdown["Service"]>(name: K) => ({ request }: { request: Request }) =>
  RuntimeServer.runPromise(pipe(Markdown, Effect.flatMap((markdown) => markdown[name](request))));

// Request-aware markdown twin endpoints.
export const homeHandler = handler("home");
export const educationHandler = handler("education");
export const contactHandler = handler("contact");
export const experienceHandler = handler("experience");

// Request-independent GEO indexes for AI ingestion.
export const llmsTxtHandler = handler("siteIndex");
export const llmsFullTxtHandler = handler("siteIndexFull");
