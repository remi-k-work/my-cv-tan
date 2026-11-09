// services, features, and other libraries
import { Effect, Option } from "effect";
import { documentRoute } from "@/lib/server-route";
import { Markdown } from "./markdown";
import { parseLangParam } from "@/features/markdown/domain/helpers";

const markdownRoute = (name: keyof Markdown["Service"]) => (request: Request) => Effect.flatMap(Markdown, (markdown) => markdown[name](request));

// Preserves cookie state on language negotiation unless an explicit ?lang= pin is present in the URL
const keepsNegotiatedLocale = (request: Request) => Option.isNone(parseLangParam(request.url));

export const homeHandler = documentRoute(markdownRoute("home"), keepsNegotiatedLocale);
export const educationHandler = documentRoute(markdownRoute("education"), keepsNegotiatedLocale);
export const contactHandler = documentRoute(markdownRoute("contact"), keepsNegotiatedLocale);
export const experienceHandler = documentRoute(markdownRoute("experience"), keepsNegotiatedLocale);

export const llmsTxtHandler = documentRoute(markdownRoute("siteIndex"));
export const llmsFullTxtHandler = documentRoute(markdownRoute("siteIndexFull"));
