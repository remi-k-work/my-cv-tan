// services, features, and other libraries
import { Effect, Record } from "effect";
import { msg } from "gt-tanstack-start";
import { RequiredDataError } from "@/features/data/domain";

// types
import type { PreferredLanguage } from "@/domain";
import type { Translate } from "./models";

// constants
import { MARKDOWN_CACHE_CONTROL, MARKDOWN_CONTENT_TYPE, MARKDOWN_VARY, TXT_CONTENT_TYPE } from "./constants";

const mdHeaders = (preferredLanguage: PreferredLanguage) => ({
  "Content-Type": MARKDOWN_CONTENT_TYPE,
  "Cache-Control": MARKDOWN_CACHE_CONTROL,
  "Content-Language": preferredLanguage,
  Vary: MARKDOWN_VARY,
  "X-Robots-Tag": "index, follow",
});

// Successful Markdown twin (200). The HTTP-level canonical mirrors the frontmatter
// one, so crawlers that never parse YAML still consolidate signals on the HTML page.
export const mdResponse = (body: string, preferredLanguage: PreferredLanguage, canonical: string) =>
  new Response(body, { headers: { ...mdHeaders(preferredLanguage), Link: `<${canonical}>; rel="canonical"` } });

// Missing slug response: still Markdown so AI fetchers get an explicit, parseable 404
export const mdNotFoundResponse = (body: string, preferredLanguage: PreferredLanguage) =>
  new Response(body, {
    status: 404,
    headers: { ...mdHeaders(preferredLanguage), "Cache-Control": "no-store", "X-Robots-Tag": "noindex, follow" },
  });

// 503 for incomplete documents: they must never be cached as if they were complete
const unavailableResponse = (body: string, headers: Record.ReadonlyRecord<string, string>) =>
  new Response(body, { status: 503, headers: { ...headers, "Cache-Control": "no-store", "X-Robots-Tag": "noindex, follow" } });

// Honest, parseable unavailable document rather than an HTML error page
export const unavailableMarkdownBody = (translate: Translate) =>
  [
    `# ${translate(msg("Content temporarily unavailable"))}`,
    ``,
    translate(msg("The required portfolio content could not be loaded. Please try again shortly.")),
    ``,
  ].join("\n");

export const mdUnavailableResponse = (body: string, preferredLanguage: PreferredLanguage) => unavailableResponse(body, mdHeaders(preferredLanguage));

export const txtUnavailableResponse = (body: string) => unavailableResponse(body, { "Content-Type": TXT_CONTENT_TYPE });

// Shared recovery for document pipelines: a data failure logs, then renders the non-cacheable 503 above
const dataResponse = (logPrefix: string, fallback: () => Response, document: Effect.Effect<Response, RequiredDataError>) =>
  document.pipe(Effect.catchTag("RequiredDataError", (error) => Effect.logError(`${logPrefix}: ${error.message}`).pipe(Effect.map(() => fallback()))));

export const markdownDataResponse = (preferredLanguage: PreferredLanguage, translate: Translate, document: Effect.Effect<Response, RequiredDataError>) =>
  dataResponse("[MARKDOWN]", () => mdUnavailableResponse(unavailableMarkdownBody(translate), preferredLanguage), document);

// Plain-text discovery documents (llms.txt): same recovery, plain-text 503
export const textDataResponse = (document: Effect.Effect<Response, RequiredDataError>) =>
  dataResponse(
    "[LLMS.TXT]",
    () => txtUnavailableResponse("llms.txt is temporarily unavailable because required portfolio content could not be loaded. Please try again shortly.\n"),
    document
  );

// Plain-text discovery document (llms.txt, robots.txt): cacheable at the CDN
export const txtResponse = (body: string) => new Response(body, { headers: { "Content-Type": TXT_CONTENT_TYPE, "Cache-Control": MARKDOWN_CACHE_CONTROL } });
