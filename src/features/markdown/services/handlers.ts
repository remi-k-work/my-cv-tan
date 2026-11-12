// services, features, and other libraries
import { Effect, Option } from "effect";
import { documentRoute } from "@/lib/server-route";
import { Markdown } from "./markdown";
import { parseLangParam } from "./request";

// constants
import { CONTACT_PATH, EDUCATION_PATH, HOME_PATH } from "@/domain/constants";

const markdownRoute = (select: (markdown: Markdown["Service"]) => (request: Request) => Effect.Effect<Response>) => (request: Request) =>
  Effect.flatMap(Markdown, (markdown) => select(markdown)(request));

// Preserves cookie state on language negotiation unless an explicit ?lang= pin is present in the URL
const keepsNegotiatedLocale = (request: Request) => Option.isNone(parseLangParam(request.url));

// The twins are negotiated documents: their shared-cacheable variants are only safe to pin to a
// visitor when the language came from the visitor's own negotiation, so their routes keep the
// cookie state the negotiation recorded
const negotiatedRoute = (select: (markdown: Markdown["Service"]) => (request: Request) => Effect.Effect<Response>) =>
  documentRoute(markdownRoute(select), keepsNegotiatedLocale);

// The indexes answer one document regardless of who asked, so nothing about the visitor is pinned
const statelessRoute = (select: (markdown: Markdown["Service"]) => (request: Request) => Effect.Effect<Response>) => documentRoute(markdownRoute(select));

export const homeHandler = negotiatedRoute((markdown) => markdown.page(HOME_PATH));
export const educationHandler = negotiatedRoute((markdown) => markdown.page(EDUCATION_PATH));
export const contactHandler = negotiatedRoute((markdown) => markdown.page(CONTACT_PATH));
export const experienceHandler = negotiatedRoute((markdown) => markdown.experience);

export const llmsTxtHandler = statelessRoute((markdown) => markdown.siteIndex);
export const llmsFullTxtHandler = statelessRoute((markdown) => markdown.siteIndexFull);
