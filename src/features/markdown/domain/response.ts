// types
import type { PreferredLanguage } from "@/domain";

// services, features, and other libraries
import { Effect } from "effect";
import { RequiredDataError } from "@/features/data/domain";
import { unavailableMarkdownBody } from "./required-data";

// constants
import { MARKDOWN_CACHE_CONTROL, MARKDOWN_CONTENT_TYPE, MARKDOWN_VARY, TXT_CONTENT_TYPE } from "./constants";

const mdHeaders = (preferredLanguage: PreferredLanguage) => ({
  "Content-Type": MARKDOWN_CONTENT_TYPE,
  "Cache-Control": MARKDOWN_CACHE_CONTROL,
  "Content-Language": preferredLanguage,
  Vary: MARKDOWN_VARY,
  "X-Robots-Tag": "index, follow",
});

// Successful Markdown document response (200)
export const mdResponse = (body: string, preferredLanguage: PreferredLanguage) => new Response(body, { headers: mdHeaders(preferredLanguage) });

// Missing slug response: still Markdown so AI fetchers get an explicit, parseable 404
export const mdNotFoundResponse = (body: string, preferredLanguage: PreferredLanguage) =>
  new Response(body, { status: 404, headers: { ...mdHeaders(preferredLanguage), "X-Robots-Tag": "noindex, follow" } });

// Unavailable content must not be cached as if it were a complete document.
export const mdUnavailableResponse = (body: string, preferredLanguage: PreferredLanguage) =>
  new Response(body, {
    status: 503,
    headers: {
      ...mdHeaders(preferredLanguage),
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, follow",
    },
  });

export const markdownDataResponse = (
  preferredLanguage: PreferredLanguage,
  document: Effect.Effect<Response, RequiredDataError>
) =>
  document.pipe(
    Effect.catchTag("RequiredDataError", (error) =>
      Effect.gen(function* () {
        yield* Effect.logError(`[MARKDOWN]: ${error.message}`);
        return mdUnavailableResponse(unavailableMarkdownBody(preferredLanguage), preferredLanguage);
      })
    )
  );

// Plain-text discovery document (llms.txt, robots.txt): cacheable at the CDN
export const txtResponse = (body: string) => new Response(body, { headers: { "Content-Type": TXT_CONTENT_TYPE, "Cache-Control": MARKDOWN_CACHE_CONTROL } });

export const txtUnavailableResponse = (body: string) =>
  new Response(body, {
    status: 503,
    headers: {
      "Content-Type": TXT_CONTENT_TYPE,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, follow",
    },
  });

export const textDataResponse = (document: Effect.Effect<Response, RequiredDataError>) =>
  document.pipe(
    Effect.catchTag("RequiredDataError", (error) =>
      Effect.gen(function* () {
        yield* Effect.logError(`[LLMS.TXT]: ${error.message}`);
        return txtUnavailableResponse("llms.txt is temporarily unavailable because required portfolio content could not be loaded. Please try again shortly.\n");
      })
    )
  );
