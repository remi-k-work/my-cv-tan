// services, features, and other libraries
import { Effect, Record } from "effect";
import { msg } from "gt-tanstack-start";
import { recoverDataFailure } from "@/features/data/domain";

// types
import type { PreferredLanguage, Translate } from "@/domain";
import type { RequiredDataError } from "@/features/data/domain";

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

// Markdown twin pipeline recovery: a data failure logs, then answers with the non-cacheable 503
export const markdownDataResponse = (preferredLanguage: PreferredLanguage, translate: Translate, document: Effect.Effect<Response, RequiredDataError>) =>
  recoverDataFailure("[MARKDOWN]", mdUnavailableResponse(unavailableMarkdownBody(translate), preferredLanguage))(document);

// Plain-text discovery documents (llms.txt, llms-full.txt): same recovery, plain-text 503 with per-document copy
export const textDataResponse = (logPrefix: string, unavailableBody: string, document: Effect.Effect<Response, RequiredDataError>) =>
  recoverDataFailure(logPrefix, txtUnavailableResponse(unavailableBody))(document);

// Plain-text discovery document (llms.txt, robots.txt): always English and cacheable at the CDN
export const txtResponse = (body: string) =>
  new Response(body, { headers: { "Content-Type": TXT_CONTENT_TYPE, "Content-Language": "en", "Cache-Control": MARKDOWN_CACHE_CONTROL } });
