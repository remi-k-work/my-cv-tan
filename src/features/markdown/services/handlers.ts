// Bridges the Markdown service endpoints to TanStack server route handlers.
// Kept apart from the service module so the dependency stays one-directional:
// the runtime provides the Markdown layer, and only this module needs the runtime.

// services, features, and other libraries
import { Effect, Option } from "effect";
import { documentRoute } from "@/lib/server-route";
import { parseLangParam } from "../domain/requests";
import { Markdown } from "./markdown";

// A language-negotiated twin's cookie is the reader's own locale until the request pins its own
// language from the URL; past that point the pin is the whole variant selector and the cookie the
// negotiation wrote is stale.
const twinKeepsVisitorState = (request: Request) => !Option.isSome(parseLangParam(request.url));

// Routes default to stripping: only the negotiated twins keep the reader's own locale cookie.
const twinRoute = (name: keyof Markdown["Service"], keepsVisitorState: (request: Request) => boolean = () => false) =>
  documentRoute((request) => Effect.flatMap(Markdown, (markdown) => markdown[name](request)), keepsVisitorState);

// Request-aware markdown twin endpoints.
export const homeHandler = twinRoute("home", twinKeepsVisitorState);
export const educationHandler = twinRoute("education", twinKeepsVisitorState);
export const contactHandler = twinRoute("contact", twinKeepsVisitorState);
export const experienceHandler = twinRoute("experience", twinKeepsVisitorState);

// The GEO indexes are one public, language-independent document, so their routes strip that state
// unconditionally. Reusing the twin policy here would keep the negotiation cookie whenever a caller
// appended a `?lang=` the document ignores, pinning a visitor-specific response in a shared cache.
export const llmsTxtHandler = twinRoute("siteIndex");
export const llmsFullTxtHandler = twinRoute("siteIndexFull");
