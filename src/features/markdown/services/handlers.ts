// Bridges the Markdown service endpoints to TanStack server route handlers.
// Kept apart from the service module so the dependency stays one-directional:
// the runtime provides the Markdown layer, and only this module needs the runtime.

// services, features, and other libraries
import { Effect, Option } from "effect";
import { documentRoute } from "@/lib/server-route";
import { parseLangParam } from "../domain/requests";
import { Markdown } from "./markdown";

// Runs one named document pipeline from the Markdown service.
const markdownRoute = (name: keyof Markdown["Service"]) => (request: Request) => Effect.flatMap(Markdown, (markdown) => markdown[name](request));

// A language-negotiated twin's cookie is the reader's own locale until the request pins its own
// language from the URL; past that point the pin is the whole variant selector and the cookie the
// negotiation wrote is stale.
const keepsNegotiatedLocale = (request: Request) => !Option.isSome(parseLangParam(request.url));

// Request-aware markdown twin endpoints: negotiated twins keep the reader's locale until the URL
// pins a language for them.
export const homeHandler = documentRoute(markdownRoute("home"), keepsNegotiatedLocale);
export const educationHandler = documentRoute(markdownRoute("education"), keepsNegotiatedLocale);
export const contactHandler = documentRoute(markdownRoute("contact"), keepsNegotiatedLocale);
export const experienceHandler = documentRoute(markdownRoute("experience"), keepsNegotiatedLocale);

// The GEO indexes are one public, language-independent document, so their routes strip that state
// unconditionally. Reusing the twin policy here would keep the negotiation cookie whenever a caller
// appended a `?lang=` the document ignores, pinning a visitor-specific response in a shared cache.
export const llmsTxtHandler = documentRoute(markdownRoute("siteIndex"));
export const llmsFullTxtHandler = documentRoute(markdownRoute("siteIndexFull"));
