// services, features, and other libraries
import { Effect, Record } from "effect";
import { msg } from "gt-tanstack-start";
import { recoverDataFailure } from "@/features/data/domain/required";

// types
import type { PreferredLanguage, Translate } from "@/domain/models";
import type { RequiredDataError } from "@/features/data/domain/required";

// constants
import { CACHE_CONTROL, NOINDEX_FOLLOW, NO_STORE, TXT_CONTENT_TYPE } from "@/features/meta/domain/constants";
import { MARKDOWN_CONTENT_TYPE, MARKDOWN_VARY } from "./constants";

const mdHeaders = (preferredLanguage: PreferredLanguage) => ({
  "Content-Type": MARKDOWN_CONTENT_TYPE,
  // Shares the CDN policy of every other machine-readable document (robots.txt, sitemap.xml, llms.txt)
  "Cache-Control": CACHE_CONTROL,
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
    headers: { ...mdHeaders(preferredLanguage), "Cache-Control": NO_STORE, "X-Robots-Tag": NOINDEX_FOLLOW },
  });

// 503 for incomplete documents: they must never be cached as if they were complete
const unavailableResponse = (body: string, headers: Record.ReadonlyRecord<string, string>) =>
  new Response(body, { status: 503, headers: { ...headers, "Cache-Control": NO_STORE, "X-Robots-Tag": NOINDEX_FOLLOW } });

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
  recoverDataFailure("[MARKDOWN]", () => mdUnavailableResponse(unavailableMarkdownBody(translate), preferredLanguage))(document);

// Plain-text discovery documents (llms.txt, llms-full.txt): same recovery, plain-text 503 with per-document copy
export const textDataResponse = (logPrefix: string, unavailableBody: string, document: Effect.Effect<Response, RequiredDataError>) =>
  recoverDataFailure(logPrefix, () => txtUnavailableResponse(unavailableBody))(document);
