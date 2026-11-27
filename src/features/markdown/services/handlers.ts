// services, features, and other libraries
import { Option } from "effect";
import { documentRoute } from "@/lib/server-route";
import { Markdown } from "./markdown";
import { parseLangParam } from "./request";

// types
import type { Effect } from "effect";
type SelectDocument = (markdown: Markdown["Service"]) => (request: Request) => Effect.Effect<Response>;

// constants
import { CONTACT_PATH, EDUCATION_PATH, HOME_PATH } from "@/domain/constants";

const markdownRoute = (select: SelectDocument, keepsVisitorState?: (request: Request) => boolean) =>
  documentRoute((request) => Markdown.use((markdown) => select(markdown)(request)), keepsVisitorState);

// Preserves cookie state on language negotiation unless an explicit ?lang= pin is present in the URL
const keepsNegotiatedLocale = (request: Request) => Option.isNone(parseLangParam(request.url));

// Negotiated twins retain visitor locale cookies unless pinned by ?lang=
export const homeHandler = markdownRoute((markdown) => markdown.page(HOME_PATH), keepsNegotiatedLocale);
export const educationHandler = markdownRoute((markdown) => markdown.page(EDUCATION_PATH), keepsNegotiatedLocale);
export const contactHandler = markdownRoute((markdown) => markdown.page(CONTACT_PATH), keepsNegotiatedLocale);
export const experienceHandler = markdownRoute((markdown) => markdown.experience, keepsNegotiatedLocale);
