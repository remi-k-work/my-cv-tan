// services, features, and other libraries
import { Array, HashSet, Match, Option, String, pipe } from "effect";
import { documentHeaders, locationHeader } from "@/features/meta/services/responses";
import { markdownTwinUrl } from "@/features/meta/domain/urls";
import { joinLinkHeader, representationLinks } from "@/features/meta/domain/link-tags";

// types
import type { PreferredLanguage } from "@/domain/models";

// constants
import { AI_DISCOVERY_LINK_HEADER, AI_DISCOVERY_LINKS } from "@/features/meta/domain/discovery";
import {
  CACHEABLE_HEADERS,
  INDEXABLE_HEADERS,
  NEGOTIATION_VARY_TOKENS,
  SERVICE_UNAVAILABLE_HEADERS,
  UNAVAILABLE_HEADERS,
} from "@/features/meta/services/responses";

const MD_CONTENT_TYPE = "text/markdown; charset=utf-8";
const NEGOTIATION_VARY = pipe(NEGOTIATION_VARY_TOKENS, Array.map(String.toLowerCase), HashSet.fromIterable);

// Strips language negotiation tokens from a Vary header, returning None when nothing remains
export const withoutNegotiationVary = (vary: string | null) =>
  pipe(
    Option.fromNullishOr(vary),
    Option.map((value) =>
      pipe(
        String.split(value, ","),
        Array.map(String.trim),
        Array.filter((token) => String.isNonEmpty(token) && !HashSet.has(NEGOTIATION_VARY, String.toLowerCase(token))),
        Array.join(", ")
      )
    ),
    // A Vary left with only negotiation tokens is no Vary at all, so the caller drops the header
    Option.filter(String.isNonEmpty)
  );

const withHeaders = (response: Response, update: (headers: Headers) => void) => {
  const headers = new Headers(response.headers);
  update(headers);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};

// Drops language negotiation Vary tokens when the URL contains an explicit ?lang= pin
export const pinCacheVariant = (response: Response) =>
  withHeaders(response, (headers) => {
    Option.match(withoutNegotiationVary(headers.get("vary")), {
      // Nothing worth negotiating on: the pinned URL already names its language, so drop Vary entirely
      onNone: () => headers.delete("vary"),
      onSome: (value) => headers.set("vary", value),
    });
  });

// Temporary source-language fallbacks must neither enter shared caches nor compete with the requested page in search indexes
export const temporaryFallbackResponse = (response: Response) =>
  withHeaders(response, (headers) => {
    headers.set("Cache-Control", UNAVAILABLE_HEADERS["Cache-Control"]);
    headers.set("X-Robots-Tag", UNAVAILABLE_HEADERS["X-Robots-Tag"]);
  });

// Enforces cache and Vary policy based on whether the response is a fallback or language-pinned
export const applyRepresentationPolicy = (response: Response, fallback: boolean, langOverride: Option.Option<PreferredLanguage>) => {
  // A fallback is temporary negotiated content, so it must bypass both caching and language pinning
  if (fallback) return temporaryFallbackResponse(response);
  // Non-cacheable errors, and unpinned responses, have no representation variant to pin
  if (!response.ok || Option.isNone(langOverride)) return response;

  return pinCacheVariant(response);
};

const markdownHeaders = (preferredLanguage: PreferredLanguage, links: string) => ({
  ...documentHeaders(preferredLanguage),
  "Content-Type": MD_CONTENT_TYPE,
  Link: links,
});

const markdownLinks = (canonical: string, markdownPath: string) => joinLinkHeader(representationLinks(canonical, markdownPath, AI_DISCOVERY_LINKS));

export const mdResponse = (input: {
  readonly body: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly canonical: string;
  readonly markdownPath: string;
}) => {
  const markdownUrl = markdownTwinUrl(input.markdownPath, input.preferredLanguage);

  return new Response(input.body, {
    status: 200,
    headers: {
      ...markdownHeaders(input.preferredLanguage, markdownLinks(input.canonical, input.markdownPath)),
      ...CACHEABLE_HEADERS,
      ...INDEXABLE_HEADERS,
      "Content-Location": markdownUrl,
    },
  });
};

const failureStatusHeaders = (status: 404 | 503) =>
  Match.value(status).pipe(
    Match.when(503, () => SERVICE_UNAVAILABLE_HEADERS),
    Match.when(404, () => UNAVAILABLE_HEADERS),
    Match.exhaustive
  );

const mdFailureResponse = (body: string, preferredLanguage: PreferredLanguage, status: 404 | 503, contentLocation?: string) =>
  new Response(body, {
    status,
    headers: {
      ...markdownHeaders(preferredLanguage, AI_DISCOVERY_LINK_HEADER),
      ...failureStatusHeaders(status),
      ...locationHeader(contentLocation),
    },
  });

const markdownLocation = (markdownPath: Option.Option<string>, preferredLanguage: PreferredLanguage) =>
  pipe(
    markdownPath,
    Option.map((path) => markdownTwinUrl(path, preferredLanguage)),
    Option.getOrUndefined
  );

export const mdNotFoundResponse = (body: string, preferredLanguage: PreferredLanguage, markdownPath: Option.Option<string>) =>
  mdFailureResponse(body, preferredLanguage, 404, markdownLocation(markdownPath, preferredLanguage));

// A retryable error still identifies the language-pinned representation the crawler requested
export const mdUnavailableResponse = (body: string, preferredLanguage: PreferredLanguage, markdownPath: Option.Option<string>) =>
  mdFailureResponse(body, preferredLanguage, 503, markdownLocation(markdownPath, preferredLanguage));
