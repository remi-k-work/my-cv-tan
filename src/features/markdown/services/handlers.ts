// services, features, and other libraries
import { Option } from "effect";
import { documentRoute } from "@/lib/server-route";
import { Markdown } from "./markdown";
import { parseLangParam } from "./request";

// types
import type { Effect } from "effect";
import type { ServerServices } from "@/lib/runtime-server";
type SelectDocument<R> = (markdown: Markdown["Service"]) => (request: Request) => Effect.Effect<Response, never, R>;

// constants
import { CONTACT_PATH, EDUCATION_PATH, HOME_PATH } from "@/domain/constants";

const markdownRoute =
  <R>(select: SelectDocument<R>) =>
  (request: Request): Effect.Effect<Response, never, Markdown | R> =>
    Markdown.use((markdown) => select(markdown)(request));

// Preserves cookie state on language negotiation unless an explicit ?lang= pin is present in the URL
const keepsNegotiatedLocale = (request: Request) => Option.isNone(parseLangParam(request.url));

// Negotiated twins retain visitor locale cookies unless pinned by ?lang=
const negotiatedRoute = <R extends ServerServices>(select: SelectDocument<R>) => documentRoute(markdownRoute(select), keepsNegotiatedLocale);

// Discovery indexes are language-independent and never carry visitor cookies
const statelessRoute = <R extends ServerServices>(select: SelectDocument<R>) => documentRoute(markdownRoute(select));

export const homeHandler = negotiatedRoute((markdown) => markdown.page(HOME_PATH));
export const educationHandler = negotiatedRoute((markdown) => markdown.page(EDUCATION_PATH));
export const contactHandler = negotiatedRoute((markdown) => markdown.page(CONTACT_PATH));
export const experienceHandler = negotiatedRoute((markdown) => markdown.experience);

export const llmsTxtHandler = statelessRoute((markdown) => markdown.siteIndex);
export const llmsFullTxtHandler = statelessRoute((markdown) => markdown.siteIndexFull);
