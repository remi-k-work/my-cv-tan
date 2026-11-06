// Bridges the Markdown service endpoints to TanStack server route handlers.
// Kept apart from the service module so the dependency stays one-directional:
// the runtime provides the Markdown layer, and only this module needs the runtime.

// services, features, and other libraries
import { Effect, Option } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { removeSetCookieHeader } from "@/lib/server-response-headers";
import { parseLangParam } from "../domain/requests";
import { Markdown } from "./markdown";

// The twins are language-negotiated, so the cookie that negotiation writes is only stale once the
// request pins its own language from the URL — before that it is the reader's own locale.
const stripWhenPinned = (request: Request) => Option.isSome(parseLangParam(request.url));

// The AI indexes are fixed English documents, so no visitor state ever applies to them.
const stripAlways = () => true;

const handler =
  (name: keyof Markdown["Service"], stripsCookies: (request: Request) => boolean) =>
  async ({ request }: { request: Request }) => {
    try {
      return await RuntimeServer.runPromise(Effect.flatMap(Markdown, (markdown) => markdown[name](request)));
    } finally {
      if (stripsCookies(request)) removeSetCookieHeader();
    }
  };

// Request-aware markdown twin endpoints.
export const homeHandler = handler("home", stripWhenPinned);
export const educationHandler = handler("education", stripWhenPinned);
export const contactHandler = handler("contact", stripWhenPinned);
export const experienceHandler = handler("experience", stripWhenPinned);

// Request-independent GEO indexes are public cache entries and do not set a visitor locale.
export const llmsTxtHandler = handler("siteIndex", stripAlways);
export const llmsFullTxtHandler = handler("siteIndexFull", stripAlways);
