// Bridges the Markdown service endpoints to TanStack server route handlers.
// Kept apart from the service module so the dependency stays one-directional:
// the runtime provides the Markdown layer, and only this module needs the runtime.

// services, features, and other libraries
import { Effect, Option } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { removeSetCookieHeader } from "@/lib/server-response-headers";
import { parseLangParam } from "../domain/requests";
import { Markdown } from "./markdown";

interface HandlerPolicy {
  readonly pinLanguage?: boolean;
  readonly suppressCookies?: boolean;
}

const handler =
  (name: keyof Markdown["Service"], policy: HandlerPolicy = {}) =>
  async ({ request }: { request: Request }) => {
    const languageIsPinned = policy.pinLanguage === true && Option.isSome(parseLangParam(request.url));

    try {
      return await RuntimeServer.runPromise(Effect.flatMap(Markdown, (markdown) => markdown[name](request)));
    } finally {
      if (policy.suppressCookies === true || languageIsPinned) removeSetCookieHeader();
    }
  };

// Request-aware markdown twin endpoints.
export const homeHandler = handler("home", { pinLanguage: true });
export const educationHandler = handler("education", { pinLanguage: true });
export const contactHandler = handler("contact", { pinLanguage: true });
export const experienceHandler = handler("experience", { pinLanguage: true });

// Request-independent GEO indexes are public cache entries and do not set a visitor locale.
export const llmsTxtHandler = handler("siteIndex", { suppressCookies: true });
export const llmsFullTxtHandler = handler("siteIndexFull", { suppressCookies: true });
