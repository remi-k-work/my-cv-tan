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

export const homeHandler = documentRoute(
  markdownRoute((markdown) => markdown.page(HOME_PATH)),
  keepsNegotiatedLocale
);
export const educationHandler = documentRoute(
  markdownRoute((markdown) => markdown.page(EDUCATION_PATH)),
  keepsNegotiatedLocale
);
export const contactHandler = documentRoute(
  markdownRoute((markdown) => markdown.page(CONTACT_PATH)),
  keepsNegotiatedLocale
);
export const experienceHandler = documentRoute(
  markdownRoute((markdown) => markdown.experience),
  keepsNegotiatedLocale
);

export const llmsTxtHandler = documentRoute(markdownRoute((markdown) => markdown.siteIndex));
export const llmsFullTxtHandler = documentRoute(markdownRoute((markdown) => markdown.siteIndexFull));
