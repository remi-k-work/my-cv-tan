// services, features, and other libraries
import { Effect } from "effect";
import { msg } from "gt-tanstack-start";
import { withLanguageParam } from "@/features/meta/domain/url";
import { recoverDataFailure } from "@/features/data/domain/required";

// types
import type { PreferredLanguage, Translate } from "@/domain/models";
import type { RequiredDataError } from "@/features/data/domain/required";

// constants
import { CACHE_CONTROL, DEFAULT_LANGUAGE, INDEXABLE_ROBOTS, NOINDEX_FOLLOW, NO_STORE, SITE_LANGUAGES } from "@/features/meta/domain/constants";
import { txtUnavailableResponse, unavailableResponse } from "@/features/meta/domain/response";
import { MARKDOWN_CONTENT_TYPE, MARKDOWN_VARY } from "./constants";
import { mdDocument, mdHeading } from "./helpers";

// Success headers shared by every Markdown twin; the robots directive is the same one the
// HTML heads emit (see INDEXABLE_ROBOTS), so AI citation surfaces stay unconstrained
const mdHeaders = (preferredLanguage: PreferredLanguage) => ({
  "Content-Type": MARKDOWN_CONTENT_TYPE,
  "Cache-Control": CACHE_CONTROL,
  "Content-Language": preferredLanguage,
  Vary: MARKDOWN_VARY,
  "X-Robots-Tag": INDEXABLE_ROBOTS,
});

// A negotiated response needs stable, fetchable URLs for each language; explicit variants keep
// crawlers from treating the Cookie or Accept-Language response as an opaque duplicate.
// x-default names the source language for requests that match no supported variant
const markdownLinks = (canonical: string, markdownUrl: string) =>
  [
    `<${canonical}>; rel="canonical"`,
    ...SITE_LANGUAGES.map((language) => `<${withLanguageParam(markdownUrl, language)}>; rel="alternate"; hreflang="${language}"; type="text/markdown"`),
    `<${withLanguageParam(markdownUrl, DEFAULT_LANGUAGE)}>; rel="alternate"; hreflang="x-default"; type="text/markdown"`,
  ].join(", ");

// Successful Markdown twin (200). The HTTP-level canonical mirrors the frontmatter
// one, while Content-Location and Link expose stable language variants for AI fetchers
export const mdResponse = (body: string, preferredLanguage: PreferredLanguage, canonical: string, markdownUrl: string) =>
  new Response(body, {
    headers: {
      ...mdHeaders(preferredLanguage),
      "Content-Location": withLanguageParam(markdownUrl, preferredLanguage),
      Link: markdownLinks(canonical, markdownUrl),
    },
  });

// Missing slug response: still Markdown so AI fetchers get an explicit, parseable 404
export const mdNotFoundResponse = (body: string, preferredLanguage: PreferredLanguage) =>
  new Response(body, {
    status: 404,
    headers: { ...mdHeaders(preferredLanguage), "Cache-Control": NO_STORE, "X-Robots-Tag": NOINDEX_FOLLOW },
  });

// 503 for incomplete documents: they must never be cached as if they were complete
export const mdUnavailableResponse = (body: string, preferredLanguage: PreferredLanguage) => unavailableResponse(body, mdHeaders(preferredLanguage));

// Honest, parseable unavailable document rather than an HTML error page
export const unavailableMarkdownBody = (translate: Translate) =>
  mdDocument([
    mdHeading(1, translate(msg("Content temporarily unavailable"))),
    translate(msg("The required portfolio content could not be loaded. Please try again shortly.")),
  ]);

// Same 503 shape for the AI indexes (llms.txt, llms-full.txt), naming the document so fetchers know what failed
export const unavailableIndexBody = (name: string) =>
  `${name} is temporarily unavailable because required portfolio content could not be loaded. Please try again shortly.\n`;

// Markdown twin pipeline recovery: a data failure logs, then answers with the non-cacheable 503
export const markdownDataResponse = (preferredLanguage: PreferredLanguage, translate: Translate, document: Effect.Effect<Response, RequiredDataError>) =>
  recoverDataFailure("[MARKDOWN]", () => mdUnavailableResponse(unavailableMarkdownBody(translate), preferredLanguage))(document);

// Plain-text discovery documents (llms.txt, llms-full.txt): same recovery, plain-text 503 with per-document copy
export const textDataResponse = (logPrefix: string, unavailableBody: string, document: Effect.Effect<Response, RequiredDataError>) =>
  recoverDataFailure(logPrefix, () => txtUnavailableResponse(unavailableBody))(document);
